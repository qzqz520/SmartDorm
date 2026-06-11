import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Building, LogIn } from "lucide-react";
import AuroraShader from "@/components/AuroraShader";
import api from "@/lib/api";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, filter: "blur(4px)", y: 8 },
  show: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function Login() {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { student_id: studentId, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-black">
      <div className="fixed right-0 top-0 bottom-0 w-1/2 z-0 max-md:hidden"><AuroraShader /></div>
      <div className="fixed left-0 top-0 bottom-0 w-1/2 min-w-[400px] z-10 flex items-center justify-center p-12 bg-black/65 backdrop-bl-2xl max-md:w-full max-md:min-w-0 max-md:p-8">
        <motion.div className="w-full max-w-[400px]" variants={stagger} initial="hidden" animate="show">
          <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 mb-6">
            <Building className="w-3.5 h-3.5" /> 智慧宿舍
          </motion.div>
          <motion.h1 variants={item} className="text-3xl font-bold text-white mb-1">👋 欢迎回来</motion.h1>
          <motion.p variants={item} className="text-sm text-white/60 mb-8">请登录您的账号以继续</motion.p>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-300 mb-4">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <motion.div variants={item} className="mb-4">
              <label className="text-xs text-white/60 font-medium mb-1.5 block">学号 / 账号</label>
              <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="请输入学号" required autoFocus
                className="w-full border border-white/10 rounded-2xl px-4 py-3 text-sm bg-white/[0.03] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/[0.06] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.08)] transition-all duration-300" />
            </motion.div>
            <motion.div variants={item} className="mb-4 relative">
              <label className="text-xs text-white/60 font-medium mb-1.5 block">密码</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" required
                  className="w-full border border-white/10 rounded-2xl px-4 py-3 pr-12 text-sm bg-white/[0.03] text-white/90 placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/[0.06] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.08)] transition-all duration-300" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-indigo-300 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
            <motion.div variants={item} className="flex items-center justify-between mb-5 text-xs">
              <label className="flex items-center gap-2 text-white/70 cursor-pointer">
                <input type="checkbox" className="accent-indigo-500 w-4 h-4" /> 记住登录状态
              </label>
              <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">忘记密码？</a>
            </motion.div>
            <motion.button variants={item} type="submit" disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold text-sm hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(99,102,241,0.5)] active:translate-y-0 transition-all duration-300 shadow-[0_4px_24px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 disabled:opacity-50">
              <LogIn className="w-4 h-4" /> {loading ? "登录中..." : "登 录"}
            </motion.button>
          </form>
          <motion.p variants={item} className="text-center mt-6 text-xs text-white/50">
            还没有账号？<Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">立即注册 →</Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
