import { Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import Analista from "@/pages/Analista";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import Atendente from "@/pages/Atendente";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/analista" element={<Analista />} />
      <Route path="/atendente" element={<Atendente />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
