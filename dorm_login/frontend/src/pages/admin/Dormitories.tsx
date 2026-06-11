import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Inbox } from "lucide-react";
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

interface Dormitory {
  id: number;
  dorm_number: string;
  capacity: number;
  occupant_count?: number;
}

export default function Dormitories() {
  const { toast } = useModuleToast();
  const [dorms, setDorms] = useState<Dormitory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Dormitory | null>(null);
  const [form, setForm] = useState({ dorm_number: "", capacity: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<Dormitory | null>(null);

  const fetchDorms = useCallback(() => {
    setLoading(true);
    api.get("/admin/dormitories")
      .then((r) => setDorms(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchDorms(); }, [fetchDorms]);

  const filtered = dorms.filter((d) =>
    d.dorm_number.includes(search)
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ dorm_number: "", capacity: "" });
    setDialogOpen(true);
  };

  const openEdit = (d: Dormitory) => {
    setEditing(d);
    setForm({ dorm_number: d.dorm_number, capacity: String(d.capacity) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        dorm_number: form.dorm_number,
        capacity: Number(form.capacity),
      };
      if (editing) {
        await api.put(`/admin/dormitories/${editing.id}`, payload);
        toast({ title: "保存成功", variant: "success" });
      } else {
        await api.post("/admin/dormitories", payload);
        toast({ title: "添加成功", variant: "success" });
      }
      setDialogOpen(false);
      fetchDorms();
    } catch (err) {
      console.error(err);
      toast({ title: "操作失败", description: (err as any)?.response?.data?.error, variant: "error" });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/admin/dormitories/${deleteConfirm.id}`);
      toast({ title: "删除成功", variant: "success" });
      setDeleteConfirm(null);
      fetchDorms();
    } catch (err) {
      console.error(err);
      toast({ title: "删除失败", description: (err as any)?.response?.data?.error, variant: "error" });
    }
  };

  return (
    <ModuleLayout>
      <PageTransition>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">宿舍管理</h2>
            <p className="text-sm text-white/50 mt-1">管理宿舍楼信息与容量</p>
          </div>
          <GradientButton onClick={openCreate}>
            <Plus className="w-4 h-4" /> 添加宿舍
          </GradientButton>
        </div>

        <Card className="border-0 shadow-lg shadow-black/20">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="搜索宿舍号..."
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
            ) : filtered.length === 0 && !loading ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.05] flex items-center justify-center">
                  <Inbox className="w-8 h-8 text-white/30" />
                </div>
                <p className="text-white/50 font-medium">暂无宿舍数据</p>
                <p className="text-sm text-white/40 mt-1">点击上方按钮添加</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>宿舍号</TableHead>
                    <TableHead>容量</TableHead>
                    <TableHead>已入住</TableHead>
                    <TableHead className="w-32">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="text-white/50">{d.id}</TableCell>
                      <TableCell className="font-medium">{d.dorm_number}</TableCell>
                      <TableCell>{d.capacity}</TableCell>
                      <TableCell>{d.occupant_count ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(d)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "编辑宿舍" : "添加宿舍"}</DialogTitle>
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
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">容量</label>
                <Input
                  type="number"
                  placeholder="请输入容量"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <GradientButton onClick={handleSave}>{editing ? "保存修改" : "确认添加"}</GradientButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-white/60">
              确定要删除宿舍「{deleteConfirm?.dorm_number}」吗？此操作不可撤销。
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>取消</Button>
              <Button variant="destructive" onClick={handleDelete}>确认删除</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageTransition>
    </ModuleLayout>
  );
}
