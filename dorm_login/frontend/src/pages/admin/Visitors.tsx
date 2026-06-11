import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ModuleLayout from "@/components/ModuleLayout";
import api from "@/lib/api";

interface Visitor {
  id: number;
  student_name: string;
  visitor_name: string;
  phone: string;
  reason: string;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending: { label: "待审批", cls: "bg-yellow-500/20 text-yellow-300" },
  approved: { label: "已通过", cls: "bg-green-500/20 text-green-300" },
  rejected: { label: "已拒绝", cls: "bg-red-500/20 text-red-300" },
};

export default function Visitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchVisitors = useCallback(() => {
    setLoading(true);
    api.get("/admin/visitors")
      .then((r) => setVisitors(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchVisitors(); }, [fetchVisitors]);

  const filtered = visitors.filter((v) =>
    v.visitor_name.includes(search) || v.student_name.includes(search) || (v.phone || "").includes(search)
  );

  const updateStatus = async (visitor: Visitor, status: string) => {
    try {
      await api.put(`/admin/visitors/${visitor.id}`, { status });
      fetchVisitors();
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (t: string) => {
    if (!t) return "-";
    return new Date(t).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ModuleLayout>
      <PageTransition>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">访客管理</h2>
          <p className="text-sm text-white/50 mt-1">审批访客预约申请</p>
        </div>

        <Card className="border-0 shadow-lg shadow-black/20">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="搜索访客名、学生或电话..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3 p-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-white/40">
                <p className="text-sm">暂无访客记录</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>学生</TableHead>
                    <TableHead>访客名</TableHead>
                    <TableHead>电话</TableHead>
                    <TableHead>事由</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead className="w-40">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((v) => {
                    const sc = STATUS_CONFIG[v.status] || { label: v.status, cls: "bg-white/[0.05] text-white" };
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="text-white/50">{v.id}</TableCell>
                        <TableCell className="font-medium">{v.student_name}</TableCell>
                        <TableCell>{v.visitor_name}</TableCell>
                        <TableCell>{v.phone || "-"}</TableCell>
                        <TableCell className="max-w-40 truncate text-white/50">{v.reason}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${sc.cls}`}>
                            {sc.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-white/50 text-xs">{formatTime(v.created_at)}</TableCell>
                        <TableCell>
                          {v.status === "pending" && (
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => updateStatus(v, "approved")}>
                                通过
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => updateStatus(v, "rejected")}>
                                拒绝
                              </Button>
                            </div>
                          )}
                        </TableCell>
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
