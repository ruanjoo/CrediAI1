import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).finally(() => setReady(true));
    } else {
      setMsg("Link inválido ou expirado. Gere outro link e confirme a URL de redirecionamento.");
      setReady(true);
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setLoading(false);
    setMsg(error ? error.message : "Senha atualizada com sucesso. Faça login novamente.");
  }

  if (!ready) return <p>Carregando…</p>;

  return (
    <div style={{ maxWidth: 420, margin: "4rem auto", fontFamily: "system-ui" }}>
      <h1>Definir nova senha</h1>
      {msg && <p>{msg}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Nova senha"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          required
          minLength={6}
          style={{ width: "100%", padding: 12, margin: "12px 0" }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Atualizando…" : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
