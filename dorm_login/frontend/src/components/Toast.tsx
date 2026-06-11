import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

interface ToastItem { id: string; title: string; description?: string; variant?: "default" | "success" | "error" | "warning"; }

const icons = { success: CheckCircle, error: AlertCircle, warning: AlertTriangle, default: Info };
const colors = { success: "border-emerald-500 bg-emerald-50 text-emerald-800", error: "border-red-500 bg-red-50 text-red-800", warning: "border-amber-500 bg-amber-50 text-amber-800", default: "border-slate-300 bg-white text-slate-800" };

export default function Toast({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(t => {
          const Icon = icons[t.variant || "default"];
          return (
            <motion.div key={t.id} initial={{ opacity:0, x:60 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:60 }}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[300px] max-w-[400px] ${colors[t.variant || "default"]}`}>
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{t.title}</p>
                {t.description && <p className="text-xs opacity-75 mt-0.5">{t.description}</p>}
              </div>
              <button onClick={() => onRemove(t.id)} className="flex-shrink-0 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
