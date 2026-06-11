import { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageTransition from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  created_at: string;
}

export default function Scores() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = useCallback(() => {
    setLoading(true);
    api.get("/student/scores")
      .then((r) => setScores(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchScores(); }, [fetchScores]);

  const formatTime = (t: string) => {
    if (!t) return "-";
    return new Date(t).toLocaleString("zh-CN", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <ModuleLayout>
      <PageTransition>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">宿舍评分</h2>
          <p className="text-sm text-white/50 mt-1">查看本宿舍的卫生、安全、纪律评分记录</p>
        </div>

        <Card className="border-0 shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="text-base">评分记录</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3 p-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : scores.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-white/40">
                <p className="text-sm">暂无评分记录</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>宿舍号</TableHead>
                    <TableHead>清洁分</TableHead>
                    <TableHead>安全分</TableHead>
                    <TableHead>纪律分</TableHead>
                    <TableHead>总分</TableHead>
                    <TableHead>备注</TableHead>
                    <TableHead>时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scores.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.dorm_number}</TableCell>
                      <TableCell>{s.score_cleanliness}</TableCell>
                      <TableCell>{s.score_safety}</TableCell>
                      <TableCell>{s.score_discipline}</TableCell>
                      <TableCell className="font-semibold text-indigo-600">{s.total_score}</TableCell>
                      <TableCell className="max-w-48 truncate text-white/50">{s.remark || "-"}</TableCell>
                      <TableCell className="text-white/50 text-xs">{formatTime(s.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </PageTransition>
    </ModuleLayout>
  );
}
