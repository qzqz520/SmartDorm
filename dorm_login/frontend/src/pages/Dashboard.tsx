import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { getNodesForRole } from "@/lib/orbital-nodes";

interface UserInfo {
  student_id: string;
  name: string;
  is_admin: boolean;
}

export default function Dashboard() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  const nodes = getNodesForRole(user?.is_admin ?? false);

  const handleNodeClick = useCallback((item: { id: number; route?: string; title: string }) => {
    if (item.route) {
      navigate(item.route);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden relative">
      {/* Top bar */}
      <motion.header
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-500/25">
            {user?.name?.[0] || "U"}
          </div>
          <div>
            <p className="text-sm font-semibold text-white/90">{user?.name || "用户"}</p>
            <p className="text-[10px] text-white/60">{user?.is_admin ? "管理员" : user?.student_id}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.p
            className="text-sm text-white/70 hidden sm:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            点击球体进入模块
          </motion.p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-red-400 hover:bg-white/5 transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" /> 退出
          </button>
        </div>
      </motion.header>

      {/* Orbital Timeline - full screen */}
      <RadialOrbitalTimeline
        key={user?.is_admin ? "admin" : "student"}
        timelineData={nodes}
        onNodeClick={handleNodeClick}
        className="flex-1"
      />

      {/* Subtle bottom hint */}
      <motion.p
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/35 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        🌐 模块导航中心 · {user?.is_admin ? "管理员" : "学生"}模式
      </motion.p>
    </div>
  );
}
