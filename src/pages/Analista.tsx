import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { History } from "lucide-react"; // Adicione esta linha no topo

// ⚠️ As libs pesadas são carregadas sob demanda
 type Row = Record<string, any>;
 type Stat = { column: string; count: number; missing: number; min?: number; max?: number; mean?: number };

export default function Analista() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  const [fileName, setFileName] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [cols, setCols] = useState<string[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [isParsing, setParsing] = useState(false);
  const [isExporting, setExporting] = useState(false);

  const [history, setHistory] = useState<any[]>([]);

  const dropRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes" as any) // <--- O segredo está aqui
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10); 

      if (error) throw error;
      if (data) setHistory(data);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    }
  };
  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate("/login");
      setEmail(session.user.email ?? null);

      const { data: roles, error } = await supabase
        .from("user_roles").select("role").eq("user_id", session.user.id);
      if (error || !roles?.some(r => r.role === "analista")) {
        toast({ title: "Acesso negado", description: "Sem permissão para acessar esta página", variant: "destructive" });
        return navigate("/");
      }
      setLoading(false);
    })();
  }, []);

  // UX de Drag & Drop
  useEffect(() => {
    const zone = dropRef.current;
    if (!zone) return;

    const onDragOver = (e: DragEvent) => { e.preventDefault(); zone.classList.add("ring-2","ring-primary"); };
    const onDragLeave = () => zone.classList.remove("ring-2","ring-primary");
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      zone.classList.remove("ring-2","ring-primary");
      const file = e.dataTransfer?.files?.[0];
      if (file) handleFile(file);
    };

    zone.addEventListener("dragover", onDragOver);
    zone.addEventListener("dragleave", onDragLeave);
    zone.addEventListener("drop", onDrop);
    return () => {
      zone.removeEventListener("dragover", onDragOver);
      zone.removeEventListener("dragleave", onDragLeave);
      zone.removeEventListener("drop", onDrop);
    };
  }, []);

  const columnsDetected = useMemo(() => cols.length, [cols]);

  function isFiniteNumber(v: any) {
    if (v === null || v === undefined || v === "") return false; const n = Number(v); return Number.isFinite(n);
  }

  function computeStats(data: Row[]): Stat[] {
    if (!data.length) return []; const headers = Object.keys(data[0]); const res: Stat[] = [];
    for (const h of headers) {
      let count = 0, missing = 0; const nums: number[] = [];
      for (const r of data) { const v = r[h]; if (v === null || v === undefined || v === "") missing++; else count++; if (isFiniteNumber(v)) nums.push(Number(v)); }
      if (nums.length) { const min = Math.min(...nums); const max = Math.max(...nums); const mean = nums.reduce((a,b)=>a+b,0)/nums.length; res.push({ column: h, count, missing, min, max, mean: Number(mean.toFixed(4)) }); }
      else res.push({ column: h, count, missing });
    }
    return res;
  }

  // --- LÓGICA DE CÁLCULO INSERIDA AQUI ---
  // Recebe uma linha (row) do CSV/XLSX e retorna a string formatada "Score - Risco"
  const calcularScoreRow = (row: Row) => {
    const salario = Number(row.salario_anual) || 0;
    const saldo = Number(row.saldo_final_mes) || 0;
    
    // Soma das dívidas
    const dividas = 
      (Number(row.emprestimo_carro) || 0) +
      (Number(row.emprestimo_casa) || 0) +
      (Number(row.emprestimo_pessoal) || 0) +
      (Number(row.emprestimo_credito) || 0) +
      (Number(row.emprestimo_estudantil) || 0);

    let pontos = 400; 
    
    pontos += (salario / 12) * 0.15;
    pontos += saldo * 0.5;
    pontos -= (dividas / 12) * 2;

    if (pontos > 1000) pontos = 1000;
    if (pontos < 0) pontos = 0;
    
    const scoreFinal = Math.floor(pontos);
    
    let risco = "Médio";
    if (scoreFinal >= 700) risco = "Baixo";
    else if (scoreFinal <= 300) risco = "Alto";

    // Retorna o valor que vai para a nova coluna
    return `${scoreFinal} (${risco})`;
  };

  async function handleFile(file: File) {
    setParsing(true); setFileName(file.name);
    try {
      const XLSX = await import(/* @vite-ignore */ "xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", raw: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      let json: Row[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      
      if (!json.length) { 
        toast({ title: "Planilha vazia", variant: "destructive" }); 
        setRows([]); setCols([]); setStats([]); 
        return; 
      }

      // --- INJEÇÃO DA NOVA COLUNA ---
      // Processamos cada linha para adicionar 'analise e risco' ANTES de salvar no estado
      const jsonProcessado = json.map(row => {
        return {
          ...row, // Mantém os dados originais
          "Analise e Risco": calcularScoreRow(row) // Adiciona a nova coluna calculada
        };
      });

      const headers = Object.keys(jsonProcessado[0]); 
      setRows(jsonProcessado); 
      setCols(headers); 
      setStats(computeStats(jsonProcessado));
      
      toast({ title: "Upload concluído", description: `${jsonProcessado.length} registros carregados e analisados.` });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Falha ao processar planilha", description: "Confira o formato CSV/XLSX", variant: "destructive" });
    } finally { setParsing(false); }
  }

  async function exportXLSX() {
    if (!rows.length) return toast({ title: "Nada para exportar", variant: "destructive" });
    setExporting(true);
    try {
      const XLSX = await import(/* @vite-ignore */ "xlsx");
      const wb = XLSX.utils.book_new();
      const wsData = [cols, ...rows.map(r => cols.map(c => r[c]))];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, "Dados com Analise"); // Nome da aba atualizado
      if (stats.length) {
        const head = ["Coluna","Preenchidos","Vazios","Mín","Máx","Média"];
        const body = stats.map(s => [s.column, s.count, s.missing, s.min ?? "", s.max ?? "", s.mean ?? ""]);
        const ws2 = XLSX.utils.aoa_to_sheet([head, ...body]);
        XLSX.utils.book_append_sheet(wb, ws2, "Estatísticas");
      }
      XLSX.writeFile(wb, `analise_risco_${Date.now()}.xlsx`);
      toast({ title: "XLSX gerado com sucesso" });
    } finally { setExporting(false); }
  }

  async function exportPDF() {
    if (!rows.length) return toast({ title: "Nada para exportar", variant: "destructive" });
    setExporting(true);
    try {
      const jsPDF = (await import(/* @vite-ignore */ "jspdf")).default;
      const autoTable = (await import(/* @vite-ignore */ "jspdf-autotable")).default;
      const doc = new jsPDF();
      doc.setFontSize(14); doc.text("Relatório de Análise de Risco – CrediAI", 14, 16);
      doc.setFontSize(10); doc.text(`Arquivo: ${fileName || "(não informado)"}`, 14, 24);
      doc.text(`Registros: ${rows.length} • Colunas: ${cols.length}` , 14, 30);
      
      // Estatísticas
      // @ts-ignore
      autoTable(doc, { startY: 36, head: [["Coluna","Preenchidos","Vazios","Mín","Máx","Média"]], body: stats.map(s => [s.column, s.count, s.missing, s.min ?? "-", s.max ?? "-", s.mean ?? "-"]), styles: { fontSize: 8 }, headStyles: { fillColor: [0,0,0] } });
      
      // Tabela principal
      const preview = rows.slice(0, 30); // Aumentei um pouco o preview para o PDF
      const previewHead = cols.map(String); 
      const previewBody = preview.map(r => cols.map(c => String(r[c] ?? "")));
      
      // @ts-ignore
      autoTable(doc, { head: [previewHead], body: previewBody, styles: { fontSize: 6 }, headStyles: { fillColor: [30,41,59] }, startY: (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 36 });
      
      doc.save(`relatorio_risco_${Date.now()}.pdf`);
      toast({ title: "PDF gerado com análise" });
    } finally { setExporting(false); }
  }

  async function handleLogout() { await supabase.auth.signOut(); navigate("/login"); }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">CrediAI – Painel do Analista</h1>
          <div className="flex items-center gap-3">
            {rows.length > 0 && (<Badge variant="outline" className="hidden sm:inline">{rows.length} registros</Badge>)}
            <Button onClick={handleLogout} variant="outline">Sair</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* CARD: Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Importar planilha para Análise de Risco</CardTitle>
            <CardDescription>O sistema calculará automaticamente o Score e o Risco para cada cliente.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
              <div ref={dropRef} className="rounded-2xl border border-dashed p-6 md:p-8 text-center transition-all bg-background/50">
                <p className="font-medium">Arraste e solte aqui</p>
                <p className="text-sm text-muted-foreground">ou selecione um arquivo</p>
                <Separator className="my-4" />
                <div className="flex items-center gap-3 justify-center">
                  <div className="space-y-2">
                    <Label htmlFor="file">Arquivo (CSV/XLSX)</Label>
                    <Input id="file" type="file" accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  </div>
                  <Button variant="secondary" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>Ver resultado</Button>
                </div>
                {fileName && <p className="mt-3 text-xs text-muted-foreground">Arquivo carregado: {fileName}</p>}
              </div>
              <div className="flex flex-col gap-3 mt-6 md:mt-8">
                <Button onClick={exportPDF} disabled={!rows.length || isExporting} className="w-full">Exportar PDF com Score</Button>
                <Button onClick={exportXLSX} disabled={!rows.length || isExporting} variant="default" className="w-full bg-green-600 hover:bg-green-700">Exportar XLSX</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RESULTADOS */}
        <Tabs defaultValue="dados" className="w-full">
          <TabsList>
            <TabsTrigger value="dados">Resultado da Análise</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas da Base</TabsTrigger>
          </TabsList>

          <TabsContent value="dados">
            <Card>
              <CardHeader>
                <CardTitle>Tabela de Clientes e Risco</CardTitle>
                <CardDescription>Dados processados com a nova coluna de Análise.</CardDescription>
              </CardHeader>
              <CardContent>
                {!rows.length ? (
                  <p className="text-sm text-muted-foreground">Faça upload para visualizar a análise.</p>
                ) : (
                  <div className="overflow-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>{cols.map(c => (<TableHead key={c} className={`whitespace-nowrap ${c === "Analise e Risco" ? "font-bold text-primary" : ""}`}>{c}</TableHead>))}</TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.slice(0,100).map((r,i) => (
                          <TableRow key={i}>
                            {cols.map(c => (
                              <TableCell key={c} className={`whitespace-nowrap max-w-[280px] overflow-hidden text-ellipsis ${c === "Analise e Risco" ? "font-medium bg-muted/50" : ""}`}>
                                {String(r[c] ?? "")}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {rows.length>100 && (<p className="p-3 text-xs text-muted-foreground">Mostrando 100 de {rows.length} linhas. Exporte para ver tudo.</p>)}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas da Planilha</CardTitle>
                <CardDescription>Visão geral dos dados numéricos importados.</CardDescription>
              </CardHeader>
              <CardContent>
                {!stats.length ? (
                  <p className="text-sm text-muted-foreground">Nada calculado ainda.</p>
                ) : (
                  <div className="overflow-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Coluna</TableHead>
                          <TableHead>Preenchidos</TableHead>
                          <TableHead>Vazios</TableHead>
                          <TableHead>Mín</TableHead>
                          <TableHead>Máx</TableHead>
                          <TableHead>Média</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stats.map(s => (
                          <TableRow key={s.column}>
                            <TableCell>{s.column}</TableCell>
                            <TableCell>{s.count}</TableCell>
                            <TableCell>{s.missing}</TableCell>
                            <TableCell>{s.min ?? "-"}</TableCell>
                            <TableCell>{s.max ?? "-"}</TableCell>
                            <TableCell>{s.mean ?? "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-xs text-muted-foreground text-center py-2">Dica: O cálculo de risco considera salário, saldo e dívidas ativas.</p>

      </main>
    </div>
  );
}