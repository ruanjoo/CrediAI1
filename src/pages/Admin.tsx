import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const institutionSchema = z.object({
  nome: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  cnpj: z.string()
    .min(14, "CNPJ inválido")
    .regex(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, "CNPJ inválido"),
});

type Institution = {
  id: string;
  nome: string;
  cnpj: string;
  created_at: string;
};

export default function Admin() {
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      await checkAccess();
      await loadInstitutions();
    })();
  }, []);

  async function checkAccess() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return navigate("/login");

    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id);

    if (error || !roles?.some(r => r.role === "administrador")) {
      toast({ title: "Acesso negado", description: "Sem permissão para acessar esta página", variant: "destructive" });
      return navigate("/");
    }
    setLoading(false);
  }

  async function loadInstitutions() {
    const { data, error } = await supabase
      .from("instituicoes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar instituições", description: error.message, variant: "destructive" });
      return;
    }
    setInstitutions(data ?? []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const v = institutionSchema.parse({ nome, cnpj });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate("/login");

      const { error } = await supabase.from("instituicoes").insert({
        nome: v.nome,
        cnpj: v.cnpj,
        created_by: session.user.id,
      });

      if (error) {
        const dup = /duplicate key|unique constraint/i.test(error.message);
        toast({
          title: dup ? "CNPJ já cadastrado" : "Erro ao cadastrar instituição",
          description: dup ? "Verifique o CNPJ informado" : error.message,
          variant: "destructive",
        });
        return;
      }

      toast({ title: "Sucesso!", description: "Instituição cadastrada" });
      setNome(""); setCnpj("");
      loadInstitutions();
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({ title: "Erro de validação", description: err.errors[0].message, variant: "destructive" });
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/10 to-primary/5">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            CrediAI - Administração
          </h1>
          <Button onClick={handleLogout} variant="outline">Sair</Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Nova Instituição</CardTitle>
            <CardDescription>Adicione bancos e instituições financeiras ao sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Instituição</Label>
                  <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Banco Exemplo" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input id="cnpj" value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" required />
                </div>
              </div>
              <Button type="submit" variant="hero">Cadastrar Instituição</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Instituições Cadastradas</CardTitle>
            <CardDescription>Lista de todas as instituições no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2">Nome</th>
                  <th className="p-2">CNPJ</th>
                  <th className="p-2">Data de Cadastro</th>
                </tr>
              </thead>
              <tbody>
                {institutions.length === 0 ? (
                  <tr><td className="p-4 text-center text-muted-foreground" colSpan={3}>Nenhuma instituição cadastrada</td></tr>
                ) : (
                  institutions.map(inst => (
                    <tr key={inst.id} className="border-b hover:bg-accent/10">
                      <td className="p-2 font-medium">{inst.nome}</td>
                      <td className="p-2">{inst.cnpj}</td>
                      <td className="p-2">{new Date(inst.created_at).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
