import { useState, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ModuleLayout from "@/components/ModuleLayout";
import api from "@/lib/api";

interface Repair {
  id: number;
  dorm_number: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待处理", variant: "secondary" },
  in_progress: { label: "处理中", variant: "default" },
  done: { label: "已完成", variant: "outline" },
  rejected: { label: "已拒绝", variant: "destructive" },
};

export default function Repairs() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ dorm_number: "", title: "", description: "" });

  const fetchRepairs = useCallback(() => {
    setLoading(true);
    api.get("/student/repairs")
      .then((r) => setRepairs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchRepairs(); }, [fetchRepairs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/student/repairs", form);
      setForm({ dorm_number: "", title: "", description: "" });
      fetchRepairs();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (t: string) => {
    if (!t) return "-";
    return new Date(t).toLocaleString("zh-CN", {
      month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <ModuleLayout>
      <PageTransition>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">报修申请</h2>
          <p className="text-sm text-white/50 mt-1">提交宿舍报修申请，查看处理进度</p>
        </div>

        {/* Submit Form */}
        <Card className="border-0 shadow-lg shadow-black/20 mb-6">
          <CardHeader>
            <CardTitle className="text-base">提交报修</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">宿舍号</label>
                  <Input
                    placeholder="请输入宿舍号"
                    value={form.dorm_number}
                    onChange={(e) => setForm({ ...form, dorm_number: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-white/70 mb-1 block">标题</label>
                  <Input
                    placeholder="请输入报修标题"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">描述</label>
                <textarea
                  className="flex min-h-24 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm ring-offset-black placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-300 resize-y"
                  placeholder="请描述报修问题"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <GradientButton type="submit" disabled={submitting} variant="indigo">
                <Send className="w-4 h-4" /> {submitting ? "提交中..." : "提交报修"}
              </GradientButton>
            </form>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="border-0 shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="text-base">报修记录</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3 p-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : repairs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-white/40">
                <p className="text-sm">暂无报修记录</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标题</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repairs.map((r) => {
                    const sc = STATUS_CONFIG[r.status] || { label: r.status, variant: "secondary" as const };
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.title}</TableCell>
                        <TableCell className="max-w-48 truncate text-white/50">{r.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                        </TableCell>
                        <TableCell className="text-white/50 text-xs">{formatTime(r.created_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </PageTransition>
    </ModuleLayout>
  );
}
