import { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Building, LayoutDashboard, Users, Wrench, UserPlus, CalendarCheck,
  Star, FileText, Megaphone, Home, Receipt, LogOut, Menu, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/Toast";
import DottedVignetteBackground from "@/components/DottedVignetteBackground";
import OrbitalBackground from "@/components/OrbitalBackground";

type ToastFn = (t: { title: string; description?: string; variant?: "default" | "success" | "error" | "warning" }) => void;
export const ToastContext = createContext<ToastFn>(() => {});
export const useToastContext = () => useContext(ToastContext);

interface User {
  student_id: string; name: string; is_admin: boolean;
}

const adminNav = [
  { section: "监控面板", items: [
    { to: "/dashboard", icon: LayoutDashboard, label: "数据仪表盘" },
  ]},
  { section: "基础管理", items: [
    { to: "/admin/students", icon: Users, label: "学生管理" },
    { to: "/admin/dormitories", icon: Building, label: "宿舍管理" },
  ]},
  { section: "业务管理", items: [
    { to: "/admin/repairs", icon: Wrench, label: "报修管理" },
    { to: "/admin/visitors", icon: UserPlus, label: "访客管理" },
    { to: "/admin/leaves", icon: CalendarCheck, label: "请假审批" },
    { to: "/admin/scores", icon: Star, label: "评分录入" },
    { to: "/admin/utility", icon: Receipt, label: "水电管理" },
    { to: "/admin/announcements", icon: Megaphone, label: "公告管理" },
  ]},
];

const studentNav = [
  { section: "我的宿舍", items: [
    { to: "/dashboard", icon: Home, label: "宿舍环境监控" },
  ]},
  { section: "生活服务", items: [
    { to: "/student/repairs", icon: Wrench, label: "报修申请" },
    { to: "/student/visitors", icon: UserPlus, label: "访客预约" },
    { to: "/student/leave", icon: CalendarCheck, label: "请假申请" },
    { to: "/student/scores", icon: Star, label: "宿舍评分" },
    { to: "/student/utility", icon: Receipt, label: "水电账单" },
    { to: "/student/announcements", icon: Megaphone, label: "公告通知" },
  ]},
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toasts, toast, removeToast } = useToast();

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
  }, []);

  const nav = user?.is_admin ? adminNav : studentNav;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <ToastContext.Provider value={toast}>
    <div className="flex h-screen relative bg-black">
      <OrbitalBackground />
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Mobile toggle */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="fixed top-3 left-3 z-50 md:hidden w-9 h-9 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg">
        {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 bg-black/90 backdrop-blur-xl border-r border-white/[0.06] text-slate-300 flex flex-col transition-all duration-300 ${sidebarOpen ? "translate-x-0 w-[240px]" : "-translate-x-full w-[240px]"} md:w-[240px] md:translate-x-0 md:hover:w-[248px] group/sidebar`}>
        {/* Brand */}
        <div className="p-5 text-center border-b border-white/5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 inline-flex items-center justify-center text-white text-lg mb-2 shadow-lg shadow-indigo-500/25 ring-2 ring-indigo-500/20">
            <Building className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-100 tracking-wide">智慧宿舍</h3>
          <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">SmartDorm</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-3">
          {nav.map((group) => (
            <div key={group.section} className="mb-4">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 py-2">{group.section}</div>
              {group.items.map((item) => (
                <Link key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-200 mb-0.5 group ${location.pathname === item.to ? "bg-gradient-to-r from-purple-500/15 via-blue-500/10 to-teal-500/10 text-white font-semibold border border-white/10" : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300"}`}>
                  <span className="relative">
                    <item.icon className={`w-4 h-4 ${location.pathname === item.to ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`} />
                    {location.pathname === item.to && <span className="absolute -right-0.5 -top-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50" />}
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-white/5 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.name || "用户"}</div>
              <div className="text-[10px] text-slate-500">{user?.is_admin ? "管理员" : user?.student_id}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors w-full">
            <LogOut className="w-3.5 h-3.5" /> 退出登录
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {children}
      </main>

      {/* Toast notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
    </ToastContext.Provider>
  );
}
