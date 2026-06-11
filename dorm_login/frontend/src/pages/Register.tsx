import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building, UserPlus } from "lucide-react";
import AuroraShader from "@/components/AuroraShader";
import api from "@/lib/api";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, filter: "blur(4px)", y: 8 },
  show: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function Register() {
  const [form, setForm] = useState({ student_id: "", name: "", dorm_number: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (form.password !== form.confirm) { setError("两次密码不一致"); return; }
    setLoading(true);
    try {
      await api.post("/auth/register", form);
      setSuccess("注册成功！即将跳转到登录页...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || "注册失败");
    } finally { setLoading(false); }
  };

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-black">
      <div className="fixed right-0 top-0 bottom-0 w-1/2 z-0 max-md:hidden"><AuroraShader /></div>
      <div className="fixed left-0 top-0 bottom-0 w-1/2 min-w-[420px] z-10 flex items-center justify-center p-12 bg-black/65 backdrop-bl-2xl overflow-y-auto max-md:w-full max-md:min-w-0 max-md:p-6">
        <motion.div className="w-full max-w-[420px]" variants={stagger} initial="hidden" animate="show">
          <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 mb-6">
            <Building className="w-3.5 h-3.5" /> 智慧宿舍
          </motion.div>
          <motion.h1 variants={item} className="text-3xl font-bold text-white mb-1">✨ 创建账号</motion.h1>
          <motion.p variants={item} className="text-sm text-white/60 mb-7">填写以下信息加入智慧宿舍管理系统</motion.p>

          {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300 mb-4">{error}</motion.div>}
          {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm text-green-300 mb-4">{success}</motion.div>}

          <form onSubmit={handleSubmit}>
            {[{ k: "student_id", label: "学号", ph: "请输入学号" }, { k: "name", label: "姓名", ph: "请输入姓名" }].map((f, i) => (
              <motion.div key={f.k} variants={item} className="mb-3.5">
                <label className="text-xs text-white/60 font-medium mb-1.5 block">{f.label}</label>
                <input type="text" value={(form as any)[f.k]} onChange={(e) => update(f.k, e.target.value)} placeholder={f.ph} required autoFocus={i === 0}
                  className="w-full border border-white/10 rounded-2xl px-4 py-3 text-sm bg-white/[0.03] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/[0.06] focus:shadow-[0_0_0_4px_rgba(59,130,246,0.08)] transition-all duration-300" />
              </motion.div>
            ))}
            <motion.div variants={item} className="mb-3.5">
              <label className="text-xs text-white/60 font-medium mb-1.5 block">宿舍号</label>
              <select value={form.dorm_number} onChange={(e) => update("dorm_number", e.target.value)} required
                className="w-full border border-white/10 rounded-2xl px-4 py-3 text-sm bg-white/[0.03] text-white/90 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/[0.06] transition-all duration-300 appearance-none">
                <option value="">-- 请选择宿舍 --</option>
              </select>
            </motion.div>
            {[{ k: "password", label: "密码", ph: "请设置密码（至少6位）" }, { k: "confirm", label: "确认密码", ph: "请再次输入密码" }].map((f) => (
              <motion.div key={f.k} variants={item} className="mb-3.5">
                <label className="text-xs text-white/60 font-medium mb-1.5 block">{f.label}</label>
                <input type="password" value={(form as any)[f.k]} onChange={(e) => update(f.k, e.target.value)} placeholder={f.ph} required minLength={6}
                  className="w-full border border-white/10 rounded-2xl px-4 py-3 text-sm bg-white/[0.03] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-blue-500/50 focus:bg-blue-500/[0.06] focus:shadow-[0_0_0_4px_rgba(59,130,246,0.08)] transition-all duration-300" />
              </motion.div>
            ))}
            <motion.button variants={item} type="submit" disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(59,130,246,0.5)] active:translate-y-0 transition-all duration-300 shadow-[0_4px_24px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 disabled:opacity-50">
              <UserPlus className="w-4 h-4" /> {loading ? "注册中..." : "注 册"}
            </motion.button>
          </form>
          <motion.p variants={item} className="text-center mt-5 text-xs text-white/50">
            已有账号？<Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">立即登录 →</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
