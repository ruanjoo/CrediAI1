import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

const signupSchema = loginSchema.extend({
  nome: z.string().min(2, { message: "Nome deve ter no mínimo 2 caracteres" }),
});

const ADM_EMAIL = "ruanjoseperdigao@gmail.com";
const ANALISTA_EMAIL = "luanakarenna@gmail.com";
const ATENDENTE_EMAIL = "marcos@gmail.com";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // redireciona só pelo email
  const redirectByEmail = (userEmail: string) => {
    const e = userEmail.toLowerCase();
    if (e === ADM_EMAIL) return navigate("/admin", { replace: true });
    if (e === ANALISTA_EMAIL) return navigate("/analista", { replace: true });
    if (e === ATENDENTE_EMAIL) return navigate("/atendente", { replace: true });
    return navigate("/", { replace: true });
  };

  // Se já estiver logado, decide pela sessão atual
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user?.email;
      if (u) redirectByEmail(u);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = loginSchema.parse({ email, password });
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validated.email,
        password: validated.password,
      });

      console.log("Login response:", data, error); // Depuração

      if (error) {
        toast({
          title: "Erro ao fazer login",
          description: error.message.includes("Invalid")
            ? "Email ou senha incorretos"
            : error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        // Agora, com base no e-mail, fazemos o redirecionamento
        const userEmail = data.user.email?.toLowerCase();
        console.log("Usuário logado:", userEmail);

        // Redireciona para /analista se for o e-mail da Luana
        if (userEmail === ANALISTA_EMAIL) {
          navigate("/analista", { replace: true });
        }
        // Redireciona para /admin se for o e-mail do ADM
        else if (userEmail === ADM_EMAIL) {
          navigate("/admin", { replace: true });
        }
        // Caso contrário, redireciona para a página principal
        else if (userEmail === ATENDENTE_EMAIL) {
          navigate("/atendente", { replace: true });
        }
        else {
          navigate("/", { replace: true });
        }
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: err.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("Erro ao fazer login:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = signupSchema.parse({ email, password, nome });
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { nome: validated.nome },
        },
      });
      if (error) throw error;

      toast({ title: "Conta criada com sucesso!", description: "Faça login para continuar" });
      setIsLogin(true);
    } catch (err: any) {
      toast({
        title: "Erro ao criar conta",
        description: err?.message ?? "Falha ao criar conta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) {
      toast({
        title: "Informe um email válido",
        description: "Preencha o campo de email para enviar o link de redefinição.",
        variant: "destructive",
      });
      return;
    }
    try {
      setForgotLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Verifique seu email", description: "Enviamos o link de redefinição." });
    } catch (err: any) {
      toast({
        title: "Não deu bom",
        description: err?.message ?? "Falha ao enviar o link.",
        variant: "destructive",
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/10 to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isLogin ? "Login" : "Criar Conta"}
          </CardTitle>
          <CardDescription className="text-center">
            {isLogin ? "Entre com suas credenciais" : "Preencha os dados para criar sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading} variant="hero">
              {loading ? "Processando..." : isLogin ? "Entrar" : "Criar Conta"}
            </Button>
            {isLogin && (
              <Button type="button" variant="outline" className="w-full" onClick={handleForgotPassword} disabled={forgotLoading || !email}>
                {forgotLoading ? "Enviando link..." : "Esqueci minha senha"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
