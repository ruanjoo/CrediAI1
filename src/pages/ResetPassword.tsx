import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const [senha, setSenha] = useState("");
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: senha });
    if (error)
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Senha alterada!", description: "Agora você pode fazer login normalmente." });
      setTimeout(() => window.location.href = "/login", 2000);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm p-6 border rounded-xl shadow">
        <h1 className="text-2xl font-semibold text-center">Definir nova senha</h1>
        <Input
          type="password"
          placeholder="Nova senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <Button type="submit" className="w-full">Salvar senha</Button>
      </form>
    </div>
  );
}
