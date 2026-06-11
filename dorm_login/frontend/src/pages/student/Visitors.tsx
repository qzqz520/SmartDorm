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

interface Visitor {
  id: number;
  visitor_name: string;
  phone: string;
  purpose: string;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待审批", variant: "secondary" },
  approved: { label: "已通过", variant: "default" },
  rejected: { label: "已拒绝", variant: "destructive" },
  checked_in: { label: "已签到", variant: "outline" },
  checked_out: { label: "已签退", variant: "outline" },
};

export default function Visitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ visitor_name: "", phone: "", purpose: "" });

  const fetchVisitors = useCallback(() => {
    setLoading(true);
    api.get("/student/visitors")
      .then((r) => setVisitors(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visitor_name.trim()) return;
    setSubmitting(true);
    try {
      await api.post("/student/visitors", form);
      setForm({ visitor_name: "", phone: "", purpose: "" });
      fetchVisitors();
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
          <h2 className="text-2xl font-bold text-white">访客预约</h2>
          <p className="text-sm text-white/50 mt-1">预约访客到访，查看预约状态</p>
        </div>

        {/* Submit Form */}
        <Card className="border-0 shadow-lg shadow-black/20 mb-6">
          <CardHeader>
            <CardTitle className="text-base">预约访客</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">访客姓名 *</label>
                  <Input
                    placeholder="请输入访客姓名"
                    value={form.visitor_name}
                    onChange={(e) => setForm({ ...form, visitor_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">电话</label>
                  <Input
                    placeholder="请输入电话号码"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">事由</label>
                <textarea
                  className="flex min-h-24 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm ring-offset-black placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-300 resize-y"
                  placeholder="请填写访客目的"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                />
              </div>
              <GradientButton type="submit" disabled={submitting} variant="emerald">
                <Send className="w-4 h-4" /> {submitting ? "提交中..." : "提交预约"}
              </GradientButton>
            </form>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="border-0 shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="text-base">预约记录</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3 p-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : visitors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-white/40">
                <p className="text-sm">暂无访客记录</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>访客姓名</TableHead>
                    <TableHead>电话</TableHead>
                    <TableHead>事由</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitors.map((v) => {
                    const sc = STATUS_CONFIG[v.status] || { label: v.status, variant: "secondary" as const };
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.visitor_name}</TableCell>
                        <TableCell className="text-white/50">{v.phone || "-"}</TableCell>
                        <TableCell className="max-w-48 truncate text-white/50">{v.purpose || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                        </TableCell>
                        <TableCell className="text-white/50 text-xs">{formatTime(v.created_at)}</TableCell>
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
