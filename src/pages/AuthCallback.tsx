import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast"; // Se quiser um toast para erros

export default function AuthCallback() {
  const nav = useNavigate();
  const { toast } = useToast(); // Para notificação de erro

  useEffect(() => {
    (async () => {
      try {
        // Recupera a sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        
        // Se não houver sessão, redireciona para login
        if (!session) return nav("/login");

        // Consulta o papel do usuário no banco
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .single();
        
        // Se ocorrer erro na consulta, exibe erro e redireciona
        if (error) {
          console.error("Erro ao consultar o papel do usuário:", error);
          toast({
            title: "Erro ao verificar a conta",
            description: "Falha ao recuperar seu papel de usuário.",
            variant: "destructive",
          });
          return nav("/login");
        }

        // Redirecionamento baseado no papel
        if (data?.role === "administrador") {
          nav("/admin");
        } else if (data?.role === "analista") {
          nav("/analista");
        } else {
          nav("/");
        }
      } catch (err) {
        console.error("Erro geral:", err);
        toast({
          title: "Erro inesperado",
          description: "Houve um erro ao processar seu login.",
          variant: "destructive",
        });
        nav("/login");
      }
    })();
  }, [nav, toast]); // Dependência no nav e toast para garantir a sincronização

  return <div>Validando login…</div>;
}
