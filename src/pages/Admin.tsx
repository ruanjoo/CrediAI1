import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// --- TIPOS E DADOS PARA A NOVA FUNCIONALIDADE (MOCK) ---
type UserData = {
  id: string;
  user_id: string;
  role: UserRole;
  active: boolean;
  created_at: string;
  instituicao_id: string | null;
  instituicoes?: { nome: string } | null;
};

const MOCK_USERS_DATA: UserData[] = [
  { 
    id: "mock-1", user_id: "8f7e-analista", role: "analista", active: true, 
    created_at: new Date().toISOString(), instituicao_id: "inst-1", instituicoes: { nome: "Banco Exemplo" } 
  },
  { 
    id: "mock-2", user_id: "2a3b-admin", role: "administrador", active: true, 
    created_at: new Date().toISOString(), instituicao_id: "inst-2", instituicoes: { nome: "Banco Teste" } 
  },
  { 
    id: "mock-3", user_id: "9c8d-inativo", role: "analista", active: false, 
    created_at: new Date().toISOString(), instituicao_id: "inst-1", instituicoes: { nome: "Banco Exemplo" } 
  },
];
// -------------------------------------------------------

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

type UserRole = "analista" | "administrador" | "instituicao";

export default function Admin() {
  const [loading, setLoading] = useState(true);

  // Estados da instituição
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  // Estados do usuário
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<UserRole>("analista");
  const [selectedInstitution, setSelectedInstitution] = useState("");

  // ESTADO DA NOVA FUNCIONALIDADE (Gerenciar Usuários)
  const [usersList, setUsersList] = useState<UserData[]>(MOCK_USERS_DATA);

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

    const isAdmin = roles?.some((r: any) => r.role === "administrador");

    if (error || !isAdmin) {
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

  // --- NOVA LÓGICA: Funções de Gerenciamento (Mock Visual) ---
  function toggleUserStatus(id: string, currentStatus: boolean) {
    const newStatus = !currentStatus;
    setUsersList(prevList => prevList.map(user => 
      user.id === id ? { ...user, active: newStatus } : user
    ));
    toast({ 
      title: newStatus ? "Usuário Ativado" : "Usuário Desativado",
      description: "Status atualizado (Visual)",
    });
  }

  function handleUpdateUserField(id: string, field: 'role' | 'instituicao_id', value: string) {
    setUsersList(prevList => prevList.map(user => {
      if (user.id === id) {
        let newInstName = user.instituicoes?.nome;
        if (field === 'instituicao_id') {
           const instMock = institutions.find(i => i.id === value);
           if (instMock) newInstName = instMock.nome;
        }
        return { ...user, [field]: value, instituicoes: { nome: newInstName || "" }};
      }
      return user;
    }));
    toast({ title: "Atualizado", description: "Dado alterado na tabela." });
  }
  // -----------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const v = institutionSchema.parse({ nome, cnpj });
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate("/login");

      const { error } = await supabase.from("instituicoes").insert({
        nome: v.nome, cnpj: v.cnpj, created_by: session.user.id,
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

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedInstitution) {
      toast({ title: "Erro", description: "Selecione uma instituição", variant: "destructive" });
      return;
    }

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: userEmail, password: userPassword, email_confirm: true,
    });

    if (authError) {
      toast({ title: "Erro ao criar usuário", description: authError.message, variant: "destructive" });
      return;
    }

    const uid = authUser.user.id;
    const payload = {
      user_id: uid,
      role: userRole,
      instituicao_id: selectedInstitution,
    };

    const { error: linkError } = await supabase.from("user_roles").insert(payload as any);

    if (linkError) {
      toast({ title: "Erro ao vincular usuário", description: linkError.message, variant: "destructive" });
      return;
    }

    // ADICIONAL: Adiciona visualmente na tabela mockada para feedback imediato
    const instName = institutions.find(i => i.id === selectedInstitution)?.nome;
    setUsersList(prev => [{
      id: `new-${Date.now()}`,
      user_id: uid,
      role: userRole,
      active: true,
      created_at: new Date().toISOString(),
      instituicao_id: selectedInstitution,
      instituicoes: { nome: instName || "Nova" }
    }, ...prev]);

    toast({ title: "Usuário criado!", description: "O usuário foi cadastrado e vinculado à instituição." });
    setUserEmail(""); setUserPassword(""); setSelectedInstitution("");
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

        {/* CADASTRAR INSTITUIÇÃO */}
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
              <Button type="submit" variant="default">Cadastrar Instituição</Button>
            </form>
          </CardContent>
        </Card>

        {/* LISTA DE INSTITUIÇÕES */}
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

        {/* CRIAR USUÁRIO */}
        <Card>
          <CardHeader>
            <CardTitle>Criar Usuário</CardTitle>
            <CardDescription>Criar um usuário e vinculá-lo a uma instituição</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={userEmail} onChange={e => setUserEmail(e.target.value)} type="email" placeholder="email@exemplo.com" required />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input value={userPassword} onChange={e => setUserPassword(e.target.value)} type="password" placeholder="••••••••" required />
              </div>
              <div className="space-y-2">
                <Label>Cargo</Label>
                <select className="border rounded p-2 w-full bg-background" value={userRole} onChange={e => setUserRole(e.target.value as UserRole)}>
                  <option value="analista">Analista</option>
                  <option value="administrador">Administrador</option>
                  <option value="instituicao">Instituição</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Instituição</Label>
                <select className="border rounded p-2 w-full bg-background" value={selectedInstitution} onChange={e => setSelectedInstitution(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.nome}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" variant="default">Criar Usuário</Button>
            </form>
          </CardContent>
        </Card>

        {/* --- NOVA SEÇÃO: GERENCIAR USUÁRIOS (TABELA MOCKADA) --- */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Usuários</CardTitle>
            <CardDescription>
              Edite permissões ou ative/desative contas (Modo de Visualização)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="p-3">ID (Ref)</th>
                    <th className="p-3">Cargo</th>
                    <th className="p-3">Instituição</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-accent/5">
                      <td className="p-3 font-mono text-xs text-muted-foreground truncate max-w-[100px]" title={user.user_id}>
                        {user.user_id}
                      </td>
                      
                      {/* Editar Cargo */}
                      <td className="p-3">
                        <select 
                          className="bg-transparent border border-transparent hover:border-input rounded cursor-pointer p-1"
                          value={user.role}
                          onChange={(e) => handleUpdateUserField(user.id, 'role', e.target.value)}
                        >
                          <option value="analista">Analista</option>
                          <option value="administrador">Admin</option>
                          <option value="instituicao">Instituição</option>
                        </select>
                      </td>

                      {/* Editar Instituição */}
                      <td className="p-3">
                        <select 
                          className="bg-transparent border border-transparent hover:border-input rounded cursor-pointer p-1 max-w-[150px]"
                          value={user.instituicao_id || ""}
                          onChange={(e) => handleUpdateUserField(user.id, 'instituicao_id', e.target.value)}
                        >
                          <option value="" disabled>Sem vínculo</option>
                          <option value="inst-1">Banco Exemplo</option>
                          <option value="inst-2">Banco Teste</option>
                          {institutions.map(inst => (
                             <option key={inst.id} value={inst.id}>{inst.nome}</option>
                          ))}
                        </select>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          user.active 
                            ? "bg-green-100 text-green-700" 
                            : "bg-red-100 text-red-700"
                        }`}>
                          {user.active ? "ATIVO" : "INATIVO"}
                        </span>
                      </td>

                      {/* Botão Ativar/Desativar */}
                      <td className="p-3 text-right">
                        <Button 
                          variant={user.active ? "destructive" : "default"} 
                          size="sm"
                          onClick={() => toggleUserStatus(user.id, !!user.active)}
                          className="h-8 text-xs"
                        >
                          {user.active ? "Desativar" : "Ativar"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}