import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Trash2, Inbox } from "lucide-react";
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

interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export default function Announcements() {
  const { toast } = useModuleToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", content: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<Announcement | null>(null);

  const fetchAnnouncements = useCallback(() => {
    setLoading(true);
    api.get("/admin/announcements")
      .then((r) => setAnnouncements(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  const filtered = announcements.filter((a) =>
    a.title.includes(search) || a.content.includes(search)
  );

  const openCreate = () => {
    setForm({ title: "", content: "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await api.post("/admin/announcements", form);
      toast({ title: "发布成功", variant: "success" });
      setDialogOpen(false);
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      toast({ title: "发布失败", description: (err as any)?.response?.data?.error, variant: "error" });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await api.delete(`/admin/announcements/${deleteConfirm.id}`);
      toast({ title: "删除成功", variant: "success" });
      setDeleteConfirm(null);
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      toast({ title: "删除失败", description: (err as any)?.response?.data?.error, variant: "error" });
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">公告管理</h2>
            <p className="text-sm text-white/50 mt-1">发布和管理系统公告</p>
          </div>
          <GradientButton onClick={openCreate} variant="indigo">
            <Plus className="w-4 h-4" /> 发布公告
          </GradientButton>
        </div>

        <Card className="border-0 shadow-lg shadow-black/20">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="搜索标题或内容..."
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
                <p className="text-white/50 font-medium">暂无公告</p>
                <p className="text-sm text-white/40 mt-1">点击上方按钮发布</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead className="w-24">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-white/50">{a.id}</TableCell>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell className="max-w-64 truncate text-white/50">{a.content}</TableCell>
                      <TableCell className="text-white/50 text-xs">{formatTime(a.created_at)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(a)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>发布公告</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">标题</label>
                <Input
                  placeholder="请输入公告标题"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">内容</label>
                <textarea
                  className="flex min-h-32 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm ring-offset-black placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-300 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  placeholder="请输入公告内容"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <GradientButton onClick={handleSave}>确认发布</GradientButton>
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
              确定要删除公告「{deleteConfirm?.title}」吗？此操作不可撤销。
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
