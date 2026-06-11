import { createContext, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Toast from "@/components/Toast";
import OrbitalBackground from "@/components/OrbitalBackground";

type ToastFn = (t: { title: string; description?: string; variant?: "default" | "success" | "error" | "warning" }) => void;
export const ModuleToastContext = createContext<{ toast: ToastFn }>({ toast: () => {} });
export const useModuleToast = () => useContext(ModuleToastContext);

export default function ModuleLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { toasts, toast, removeToast } = useToast();

  return (
    <ModuleToastContext.Provider value={{ toast }}>
      <div className="flex flex-col h-screen bg-black overflow-hidden">
        <OrbitalBackground />

        {/* Top bar */}
        <header className="relative z-20 shrink-0 flex items-center gap-4 px-6 py-3 border-b border-white/[0.06] bg-black/60 backdrop-blur-xl">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">返回导航中心</span>
          </button>
        </header>

        {/* Content */}
        <main className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 text-white/90">
          {children}
        </main>

        <Toast toasts={toasts} onRemove={removeToast} />
      </div>
    </ModuleToastContext.Provider>
  );
}
