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
import ModuleLayout from "@/components/ModuleLayout";
import api from "@/lib/api";

interface Score {
  id: number;
  dorm_number: string;
  score_cleanliness: number;
  score_safety: number;
  score_discipline: number;
  total_score: number;
  remark: string;
}

export default function Scores() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ dorm_number: "", cleanliness: "", safety: "", discipline: "", remark: "" });

  const fetchScores = useCallback(() => {
    setLoading(true);
    api.get("/admin/scores")
      .then((r) => setScores(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  const filtered = scores.filter((s) =>
    s.dorm_number.includes(search) || (s.remark || "").includes(search)
  );

  const openCreate = () => {
    setForm({ dorm_number: "", cleanliness: "", safety: "", discipline: "", remark: "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await api.post("/admin/scores", {
        dorm_number: form.dorm_number,
        score_cleanliness: Number(form.cleanliness),
        score_safety: Number(form.safety),
        score_discipline: Number(form.discipline),
        remark: form.remark,
      });
      setDialogOpen(false);
      fetchScores();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ModuleLayout>
      <PageTransition>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">评分录入</h2>
            <p className="text-sm text-white/50 mt-1">录入宿舍卫生、安全、纪律评分</p>
          </div>
          <GradientButton onClick={openCreate} variant="amber">
            <Plus className="w-4 h-4" /> 录入评分
          </GradientButton>
        </div>

        <Card className="border-0 shadow-lg shadow-black/20">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="搜索宿舍号或备注..."
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
                <p className="text-sm">暂无评分记录</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>宿舍号</TableHead>
                    <TableHead>清洁</TableHead>
                    <TableHead>安全</TableHead>
                    <TableHead>纪律</TableHead>
                    <TableHead>总分</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-white/50">{s.id}</TableCell>
                      <TableCell className="font-medium">{s.dorm_number}</TableCell>
                      <TableCell>{s.score_cleanliness}</TableCell>
                      <TableCell>{s.score_safety}</TableCell>
                      <TableCell>{s.score_discipline}</TableCell>
                      <TableCell className="font-semibold text-indigo-400">{s.total_score}</TableCell>
                      <TableCell className="max-w-48 truncate text-white/50">{s.remark || "-"}</TableCell>
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
              <DialogTitle>录入评分</DialogTitle>
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">清洁分</label>
                  <Input
                    type="number"
                    placeholder="0-100"
                    value={form.cleanliness}
                    onChange={(e) => setForm({ ...form, cleanliness: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">安全分</label>
                  <Input
                    type="number"
                    placeholder="0-100"
                    value={form.safety}
                    onChange={(e) => setForm({ ...form, safety: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">纪律分</label>
                  <Input
                    type="number"
                    placeholder="0-100"
                    value={form.discipline}
                    onChange={(e) => setForm({ ...form, discipline: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-white/70 mb-1 block">备注</label>
                <Input
                  placeholder="请输入备注（可选）"
                  value={form.remark}
                  onChange={(e) => setForm({ ...form, remark: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              <GradientButton onClick={handleSave} variant="amber">确认录入</GradientButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageTransition>
    </ModuleLayout>
  );
}
