import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ModuleLayout, { useModuleToast } from "@/components/ModuleLayout";
import api from "@/lib/api";

interface Repair {
  id: number;
  student_name: string;
  dormitory_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending: { label: "待处理", cls: "bg-yellow-100 text-yellow-800" },
  in_progress: { label: "处理中", cls: "bg-blue-100 text-blue-800" },
  done: { label: "已完成", cls: "bg-green-100 text-green-800" },
  rejected: { label: "已拒绝", cls: "bg-red-100 text-red-800" },
};

const NEXT_STATUS: Record<string, string> = {
  pending: "in_progress",
  in_progress: "done",
};

export default function Repairs() {
  const { toast } = useModuleToast();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchRepairs = useCallback(() => {
    setLoading(true);
    api.get("/admin/repairs")
      .then((r) => setRepairs(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchRepairs(); }, [fetchRepairs]);

  const filtered = repairs.filter((r) =>
    r.title.includes(search) || r.student_name.includes(search) || (r.dormitory_id || "").includes(search)
  );

  const cycleStatus = async (repair: Repair) => {
    const next = NEXT_STATUS[repair.status];
    if (!next) return;
    try {
      await api.put(`/admin/repairs/${repair.id}`, { status: next });
      toast({ title: "状态已更新", variant: "success" });
      fetchRepairs();
    } catch (err) {
      console.error(err);
      toast({ title: "操作失败", description: (err as any)?.response?.data?.error, variant: "error" });
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
          <h2 className="text-2xl font-bold text-white">报修管理</h2>
          <p className="text-sm text-white/50 mt-1">管理学生的报修申请，点击状态可切换</p>
        </div>

        <Card className="border-0 shadow-lg shadow-black/20">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="搜索标题、学生或宿舍..."
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
                <p className="text-sm">暂无报修记录</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>学生</TableHead>
                    <TableHead>宿舍</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const sc = STATUS_CONFIG[r.status] || { label: r.status, cls: "bg-white/[0.05] text-white" };
                    const canCycle = r.status in NEXT_STATUS;
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="text-white/50">{r.id}</TableCell>
                        <TableCell className="font-medium">{r.student_name}</TableCell>
                        <TableCell>{r.dormitory_id || "-"}</TableCell>
                        <TableCell>{r.title}</TableCell>
                        <TableCell className="max-w-48 truncate text-white/50">{r.description}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${sc.cls} ${canCycle ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                            onClick={() => canCycle && cycleStatus(r)}
                            title={canCycle ? "点击切换状态" : undefined}
                          >
                            {sc.label}
                          </span>
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
