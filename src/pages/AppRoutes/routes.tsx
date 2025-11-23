import { Routes, Route } from "react-router-dom";
import Index from "../Index";
import Login from "../Login";
import Admin from "../Admin";
import Analista from "../Analista";
import ResetPassword from "../ResetPassword";
import NotFound from "../NotFound";
import Atendente from "../Atendente";

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
