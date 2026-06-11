import { useState, useEffect, useCallback } from "react";
import { Plus, Search } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ModuleLayout, { useModuleToast } from "@/components/ModuleLayout";
import api from "@/lib/api";

interface Utility {
  id: number;
  dorm_number: string;
  water_usage: number;
  electricity_usage: number;
  water_fee: number;
  electricity_fee: number;
  total_fee: number;
  billing_month: string;
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  unpaid: { label: "未缴纳", cls: "bg-yellow-500/20 text-yellow-300" },
  paid: { label: "已缴纳", cls: "bg-green-500/20 text-green-300" },
};

export default function Utility() {
  const { toast } = useModuleToast();
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ dorm_number: "", prev_water: "", curr_water: "", prev_electricity: "", curr_electricity: "", billing_month: "" });

  const fetchUtilities = useCallback(() => {
    setLoading(true);
    api.get("/admin/utility")
      .then((r) => setUtilities(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUtilities(); }, [fetchUtilities]);

  const filtered = utilities.filter((u) =>
    (u.dorm_number || "").includes(search) || (u.billing_month || "").includes(search)
  );

  const openCreate = () => {
    const now = new Date();
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setForm({ dorm_number: "", prev_water: "", curr_water: "", prev_electricity: "", curr_electricity: "", billing_month: defaultMonth });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await api.post("/admin/utility", {
        dorm_number: form.dorm_number,
        billing_month: form.billing_month,
        prev_water: Number(form.prev_water),
        curr_water: Number(form.curr_water),
        prev_electricity: Number(form.prev_electricity),
        curr_electricity: Number(form.curr_electricity),
      });
      toast({ title: "录入成功", variant: "success" });
      setDialogOpen(false);
      fetchUtilities();
    } catch (err) {
      console.error(err);
      toast({ title: "录入失败", description: (err as any)?.response?.data?.error, variant: "error" });
    }
  };

  return (
    <ModuleLayout>
      <PageTransition>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">水电管理</h2>
            <p className="text-sm text-white/50 mt-1">录入和管理宿舍水电费用</p>
          </div>
          <GradientButton onClick={openCreate} variant="blue">
            <Plus className="w-4 h-4" /> 录入账单
          </GradientButton>
        </div>

        <Card className="border-0 shadow-lg shadow-black/20">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="搜索宿舍号或月份..."
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
                <p className="text-sm">暂无水电账单</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>宿舍号</TableHead>
                    <TableHead>用水量</TableHead>
                    <TableHead>用电量</TableHead>
                    <TableHead>水费</TableHead>
                    <TableHead>电费</TableHead>
                    <TableHead>合计</TableHead>
                    <TableHead>月份</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => {
                    const sc = STATUS_CONFIG[u.status] || { label: u.status || "未知", cls: "bg-white/[0.05] text-white/80" };
                    return (
                      <TableRow key={u.id}>
                        <TableCell className="text-white/50">{u.id}</TableCell>
                        <TableCell className="font-medium">{u.dorm_number}</TableCell>
                        <TableCell>{u.water_usage ?? 0} 吨</TableCell>
                        <TableCell>{u.electricity_usage ?? 0} 度</TableCell>
                        <TableCell>¥{(u.water_fee ?? 0).toFixed(2)}</TableCell>
                        <TableCell>¥{(u.electricity_fee ?? 0).toFixed(2)}</TableCell>
                        <TableCell className="font-semibold text-indigo-400">¥{(u.total_fee ?? 0).toFixed(2)}</TableCell>
                        <TableCell>{u.billing_month || "-"}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${sc.cls}`}>
                            {sc.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>录入水电账单</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">宿舍号</label>
                <Input
                  placeholder="请输入宿舍号"
                  value={form.dorm_number}
                  onChange={(e) => setForm({ ...form, dorm_number: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">上次水表读数</label>
                  <Input
                    type="number"
                    placeholder="上次读数"
                    value={form.prev_water}
                    onChange={(e) => setForm({ ...form, prev_water: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">本次水表读数</label>
                  <Input
                    type="number"
                    placeholder="本次读数"
                    value={form.curr_water}
                    onChange={(e) => setForm({ ...form, curr_water: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">上次电表读数</label>
                  <Input
                    type="number"
                    placeholder="上次读数"
                    value={form.prev_electricity}
                    onChange={(e) => setForm({ ...form, prev_electricity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">本次电表读数</label>
                  <Input
                    type="number"
                    placeholder="本次读数"
                    value={form.curr_electricity}
                    onChange={(e) => setForm({ ...form, curr_electricity: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">月份</label>
                <Input
                  type="month"
                  value={form.billing_month}
                  onChange={(e) => setForm({ ...form, billing_month: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <GradientButton onClick={handleSave} variant="blue">确认录入</GradientButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageTransition>
    </ModuleLayout>
  );
}
