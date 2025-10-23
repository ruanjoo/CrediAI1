import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Analista() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
    })();
  }, []);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-2">Painel do Analista</h1>
      <p className="text-muted-foreground">Bem-vindo{email ? `, ${email}` : ""}.</p>
      {/* aqui depois entra o upload de CSV e a geração de score */}
    </div>
  );
}
