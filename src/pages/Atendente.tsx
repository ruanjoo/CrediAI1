import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Trash2, FileDown, Calculator, History } from "lucide-react";

// Definindo a interface para os dados do formulário
interface FormData {
  cpf: string;
  nome: string;
  data_nascimento: string;
  profissao: string;
  salario_anual: string;
  num_contas: string;
  num_cartoes: string;
  saldo_final_mes: string;
  emprestimo_carro: string;
  emprestimo_casa: string;
  emprestimo_pessoal: string;
  emprestimo_credito: string;
  emprestimo_estudantil: string;
}

// Interface para o histórico (ajuste os campos conforme seu banco de dados)
interface HistoryItem {
  id: string;
  created_at: string;
  nome: string;
  cpf: string;
  // Assumindo que seu banco salvou esses campos fora do JSON, ou você acessa via JSON
  dados: {
    score_sistema: number;
    risco_sistema: string;
  };
}

export default function Atendente() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [scoreCalculado, setScoreCalculado] = useState<{ valor: number; risco: string } | null>(null);
  
  // Novo estado para o histórico
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Estado do Formulário
  const [formData, setFormData] = useState<FormData>({
    cpf: "",
    nome: "",
    data_nascimento: "",
    profissao: "",
    salario_anual: "",
    num_contas: "",
    num_cartoes: "",
    saldo_final_mes: "",
    emprestimo_carro: "",
    emprestimo_casa: "",
    emprestimo_pessoal: "",
    emprestimo_credito: "",
    emprestimo_estudantil: "",
  });

  // Função para buscar o histórico
  const fetchHistory = async (currentUserId: string) => {
    try {
      // Usando 'as any' para evitar bloqueios do TypeScript
      const { data, error } = await supabase
        .from('pessoas' as any)
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error("Erro ao buscar histórico:", error);
      } else if (data) {
        console.log("🔍 DADOS VINDOS DO BANCO:", data); // <--- OLHE AQUI NO F12 SE ESTÁ 'dados', 'info', 'json' etc.
        setHistory(data as any);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setUserId(session.user.id);
        // Carrega o histórico assim que pega o ID do usuário
        fetchHistory(session.user.id);
      }
    });
  }, []);

  // --- LÓGICA DE CÁLCULO DE SCORE ---
  const calcularScoreInterno = () => {
    const salario = Number(formData.salario_anual) || 0;
    const saldo = Number(formData.saldo_final_mes) || 0;
    
    // Soma das dívidas
    const dividas = 
      (Number(formData.emprestimo_carro) || 0) +
      (Number(formData.emprestimo_casa) || 0) +
      (Number(formData.emprestimo_pessoal) || 0) +
      (Number(formData.emprestimo_credito) || 0) +
      (Number(formData.emprestimo_estudantil) || 0);

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

    return { valor: scoreFinal, risco };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "cpf") {
      const onlyNums = value.replace(/\D/g, "").slice(0, 11);
      setFormData(prev => ({ ...prev, [name]: onlyNums }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setScoreCalculado(null);
  };

  const handleSave = async () => {
    if (!formData.cpf || !formData.nome) {
      toast({ title: "Erro", description: "CPF e Nome são obrigatórios.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const analise = calcularScoreInterno();
      setScoreCalculado(analise);

      const dadosJson = {
        ...formData,
        salario_anual: Number(formData.salario_anual),
        num_contas: Number(formData.num_contas),
        num_cartoes: Number(formData.num_cartoes),
        saldo_final_mes: Number(formData.saldo_final_mes),
        emprestimo_carro: Number(formData.emprestimo_carro),
        emprestimo_casa: Number(formData.emprestimo_casa),
        emprestimo_pessoal: Number(formData.emprestimo_pessoal),
        emprestimo_credito: Number(formData.emprestimo_credito),
        emprestimo_estudantil: Number(formData.emprestimo_estudantil),
        status: "analisado_auto",
        score_sistema: analise.valor,
        risco_sistema: analise.risco
      };

      const { error } = await supabase.rpc("upsert_pessoa_analisada" as any, {
        p_cpf: formData.cpf,
        p_nome: formData.nome,
        p_dados: dadosJson,
        p_user_id: userId
      });

      if (error) throw error;

      toast({ 
        title: "Sucesso!", 
        description: `Cliente salvo. Score calculado: ${analise.valor} (${analise.risco} Risco).` 
      });

      // Atualiza a tabela de histórico após salvar
      if (userId) await fetchHistory(userId);
      
    } catch (error: any) {
      console.error(error);
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!formData.nome) {
      toast({ title: "Atenção", description: "Preencha pelo menos o nome para gerar o relatório.", variant: "destructive" });
      return;
    }

    setExporting(true);
    try {
      const analise = calcularScoreInterno();
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, 210, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("Relatório de Análise de Crédito", 14, 20);
      doc.setFontSize(12);
      doc.text("CrediAI - Sistema Inteligente", 14, 30);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 50);
      
      const tableData = [
        ["CPF", formData.cpf],
        ["Nome", formData.nome],
        ["Profissão", formData.profissao],
        ["Salário Anual", `R$ ${formData.salario_anual}`],
        ["Saldo Mensal", `R$ ${formData.saldo_final_mes}`],
        ["Nº Contas/Cartões", `${formData.num_contas} / ${formData.num_cartoes}`],
      ];

      // @ts-ignore
      autoTable(doc, {
        startY: 55,
        head: [["Campo", "Informação"]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [52, 73, 94] },
      });

      // @ts-ignore
      const finalY = doc.lastAutoTable.finalY + 15;
      
      doc.setFontSize(14);
      doc.text("Resultado da Análise Preliminar", 14, finalY);

      let colorRisco: [number, number, number] = [0, 0, 0];
      if (analise.risco === "Alto") colorRisco = [192, 57, 43];
      if (analise.risco === "Médio") colorRisco = [211, 84, 0];
      if (analise.risco === "Baixo") colorRisco = [39, 174, 96];

      const analiseData = [
        ["Score Calculado (0-1000)", analise.valor.toString()],
        ["Classificação de Risco", analise.risco.toUpperCase()]
      ];

      // @ts-ignore
      autoTable(doc, {
        startY: finalY + 5,
        body: analiseData,
        theme: 'striped',
        styles: { fontSize: 12, fontStyle: 'bold' },
        columnStyles: {
          1: { textColor: colorRisco }
        }
      });

      doc.save(`analise_${formData.nome.replace(/\s+/g, '_')}.pdf`);
      toast({ title: "PDF Exportado", description: "O relatório foi baixado com sucesso." });

    } catch (error) {
      console.error(error);
      toast({ title: "Erro no PDF", description: "Não foi possível gerar o arquivo.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  const handleClear = () => {
    setFormData({
      cpf: "", nome: "", data_nascimento: "", profissao: "", salario_anual: "",
      num_contas: "", num_cartoes: "", saldo_final_mes: "", emprestimo_carro: "",
      emprestimo_casa: "", emprestimo_pessoal: "", emprestimo_credito: "", emprestimo_estudantil: ""
    });
    setScoreCalculado(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            CrediAI – Painel do Atendente
          </h1>
          <Button onClick={handleLogout} variant="ghost" className="text-slate-600 hover:text-red-600">
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-10">
          
          {/* COLUNA ESQUERDA: FORMULÁRIO */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cadastro e Análise</CardTitle>
                <CardDescription>Dados para cálculo de risco e registro no Supabase.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* DADOS PESSOAIS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf" className="font-bold text-primary">CPF</Label>
                    <Input 
                      id="cpf" name="cpf" placeholder="Apenas números" 
                      value={formData.cpf} onChange={handleChange} maxLength={11}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <Label htmlFor="data_nascimento">Data Nascimento</Label>
                    <Input id="data_nascimento" name="data_nascimento" type="date" value={formData.data_nascimento} onChange={handleChange} />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="profissao">Profissão</Label>
                    <Input id="profissao" name="profissao" value={formData.profissao} onChange={handleChange} />
                  </div>
                </div>

                {/* DADOS FINANCEIROS */}
                <div className="bg-slate-50 p-4 rounded-md border">
                  <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Saúde Financeira</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="salario_anual">Salário Anual (R$)</Label>
                      <Input id="salario_anual" name="salario_anual" type="number" placeholder="0.00" value={formData.salario_anual} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saldo_final_mes">Saldo Fim Mês (R$)</Label>
                      <Input id="saldo_final_mes" name="saldo_final_mes" type="number" placeholder="0.00" value={formData.saldo_final_mes} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="num_contas">Nº Contas Bancárias</Label>
                      <Input id="num_contas" name="num_contas" type="number" value={formData.num_contas} onChange={handleChange} />
                    </div>
                  </div>
                </div>

                {/* EMPRÉSTIMOS */}
                <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-4 text-muted-foreground">Dívidas Ativas (Valores Totais)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Carro</Label>
                            <Input name="emprestimo_carro" type="number" value={formData.emprestimo_carro} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Casa/Imóvel</Label>
                            <Input name="emprestimo_casa" type="number" value={formData.emprestimo_casa} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Pessoal</Label>
                            <Input name="emprestimo_pessoal" type="number" value={formData.emprestimo_pessoal} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Cartão Crédito</Label>
                            <Input name="emprestimo_credito" type="number" value={formData.emprestimo_credito} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Estudantil</Label>
                            <Input name="emprestimo_estudantil" type="number" value={formData.emprestimo_estudantil} onChange={handleChange} />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <Button onClick={handleSave} disabled={loading} className="bg-primary hover:bg-primary/90 text-white min-w-[140px]">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Dados
                  </Button>
                  
                  <Button onClick={handleExportPDF} disabled={exporting} variant="secondary" className="border min-w-[140px]">
                    {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
                    Exportar PDF
                  </Button>

                  <Button variant="ghost" onClick={handleClear} className="ml-auto text-slate-500">
                    <Trash2 className="mr-2 h-4 w-4" /> Limpar
                  </Button>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* COLUNA DIREITA: PREVIEW DO SCORE */}
          <div className="lg:col-span-1">
            <Card className={`sticky top-4 transition-colors duration-500 ${scoreCalculado ? 'border-primary' : 'border-dashed'}`}>
              <CardHeader className="bg-slate-100/50">
                <CardTitle className="text-lg">Resumo da Análise</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 text-center space-y-6">
                {scoreCalculado ? (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Score Calculado</p>
                      <div className="text-5xl font-bold text-slate-800">{scoreCalculado.valor}</div>
                      <p className="text-xs text-slate-400">de 1000 pontos</p>
                    </div>
                    
                    <div className={`p-4 rounded-lg border ${
                      scoreCalculado.risco === 'Baixo' ? 'bg-green-50 border-green-200 text-green-700' :
                      scoreCalculado.risco === 'Médio' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                      'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      <span className="block text-sm font-semibold uppercase tracking-wide">Risco Estimado</span>
                      <span className="text-2xl font-bold">{scoreCalculado.risco}</span>
                    </div>

                    <p className="text-sm text-slate-500">
                      Este cálculo é uma estimativa baseada na renda anual declarada frente ao total de dívidas ativas.
                    </p>
                  </>
                ) : (
                  <div className="py-10 text-slate-400">
                    <Calculator className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Preencha os dados e clique em salvar para ver a estimativa.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>

        {/* NOVA SEÇÃO: HISTÓRICO DE ANÁLISES */}
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico Recente
              </CardTitle>
              <CardDescription>Últimas 10 análises realizadas por você.</CardDescription>
            </CardHeader>
            <div className="max-w-6xl mx-auto">
          <Card>
            {/* AQUI ENTRA O CÓDIGO QUE VOCÊ MANDOU: */}
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-3">Nome</th>
                      <th className="px-6 py-3">CPF</th>
                      <th className="px-6 py-3">Data</th>
                      <th className="px-6 py-3">Score</th>
                      <th className="px-6 py-3">Risco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                          Nenhuma análise encontrada.
                        </td>
                      </tr>
                    ) : (
                      history.map((item: any) => {
                        // AGORA FUNCIONA: O banco retorna 'score' direto na raiz do item
                        const score = item.score ?? 0;
                        
                        // Lógica visual para definir o risco e a cor
                        // Se você quiser usar o que veio do banco, use: const risco = item.status || "Médio";
                        let risco = "Médio";
                        if (score >= 700) risco = "Baixo";
                        if (score <= 300) risco = "Alto";
                        
                        // Ajuste fino para ler o status salvo caso exista
                        if (item.status && (item.status === 'Baixo' || item.status === 'Alto' || item.status === 'Médio')) {
                           risco = item.status;
                        }

                        return (
                          <tr key={item.id} className="bg-white border-b hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900">{item.nome}</td>
                            <td className="px-6 py-4">{item.cpf}</td>
                            <td className="px-6 py-4">
                              {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : "-"}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-700">
                              {score}
                            </td>
                            <td className="px-6 py-4">
                              {(() => {
                                let colorClass = "text-slate-600";
                                // Verifica variações de texto para pintar corretamente
                                const r = risco.toLowerCase();
                                if (r.includes("baixo") || r.includes("aprovado")) 
                                    colorClass = "text-green-600 font-bold bg-green-100 px-2 py-1 rounded text-xs";
                                else if (r.includes("médio") || r.includes("medio")) 
                                    colorClass = "text-orange-600 font-bold bg-orange-100 px-2 py-1 rounded text-xs";
                                else if (r.includes("alto") || r.includes("reprovado")) 
                                    colorClass = "text-red-600 font-bold bg-red-100 px-2 py-1 rounded text-xs";
                                
                                return <span className={colorClass}>{risco}</span>;
                              })()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
          </Card>
        </div>
      </main>
    </div>
  );
}