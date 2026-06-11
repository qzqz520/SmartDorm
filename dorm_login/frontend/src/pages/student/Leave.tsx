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

interface Leave {
  id: number;
  leave_type: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

const LEAVE_TYPES = ["事假", "病假", "公假", "其他"];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待审批", variant: "secondary" },
  approved: { label: "已通过", variant: "default" },
  rejected: { label: "已拒绝", variant: "destructive" },
};

export default function Leave() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ leave_type: "事假", reason: "", start_date: "", end_date: "" });

  const fetchLeaves = useCallback(() => {
    setLoading(true);
    api.get("/student/leaves")
      .then((r) => setLeaves(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim() || !form.start_date || !form.end_date) return;
    setSubmitting(true);
    try {
      await api.post("/student/leaves", form);
      setForm({ leave_type: "事假", reason: "", start_date: "", end_date: "" });
      fetchLeaves();
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
          <h2 className="text-2xl font-bold text-white">请假申请</h2>
          <p className="text-sm text-white/50 mt-1">提交请假申请，查看审批状态</p>
        </div>

        {/* Submit Form */}
        <Card className="border-0 shadow-lg shadow-black/20 mb-6">
          <CardHeader>
            <CardTitle className="text-base">提交请假</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">请假类型</label>
                <select
                  className="flex h-10 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm ring-offset-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-300"
                  value={form.leave_type}
                  onChange={(e) => setForm({ ...form, leave_type: e.target.value })}
                >
                  {LEAVE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">原因 *</label>
                <textarea
                  className="flex min-h-24 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm ring-offset-black placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-300 resize-y"
                  placeholder="请填写请假原因"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">开始日期 *</label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">结束日期 *</label>
                  <Input
                    type="date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <GradientButton type="submit" disabled={submitting} variant="rose">
                <Send className="w-4 h-4" /> {submitting ? "提交中..." : "提交请假"}
              </GradientButton>
            </form>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="border-0 shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="text-base">请假记录</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3 p-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : leaves.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-white/40">
                <p className="text-sm">暂无请假记录</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>类型</TableHead>
                    <TableHead>原因</TableHead>
                    <TableHead>日期范围</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>提交时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((l) => {
                    const sc = STATUS_CONFIG[l.status] || { label: l.status, variant: "secondary" as const };
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.leave_type}</TableCell>
                        <TableCell className="max-w-48 truncate text-white/50">{l.reason}</TableCell>
                        <TableCell className="text-white/50 text-xs">
                          {l.start_date} ~ {l.end_date}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                        </TableCell>
                        <TableCell className="text-white/50 text-xs">{formatTime(l.created_at)}</TableCell>
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
