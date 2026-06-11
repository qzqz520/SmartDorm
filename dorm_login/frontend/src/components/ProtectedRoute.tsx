import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    api.get("/auth/me").then(r => setUser(r.data)).catch(() => localStorage.removeItem("token")).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-white/10 border-t-indigo-500 rounded-full animate-spin" /></div>;
  if (!token || !user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
