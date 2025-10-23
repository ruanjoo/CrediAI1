import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const nav = useNavigate();
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return nav("/login");
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", session.user.id).single();
      if (data?.role === "administrador") nav("/admin");
      else if (data?.role === "analista") nav("/analista");
      else nav("/");
    })();
  }, [nav]);
  return <div>Validando login…</div>;
}