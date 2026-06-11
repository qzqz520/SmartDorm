import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ModuleLayout from "@/components/ModuleLayout";
import PageTransition from "@/components/PageTransition";
import api from "@/lib/api";

interface Announcement {
  id: number;
  title: string;
  content: string;
  is_pinned: number;
  created_at: string;
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(() => {
    setLoading(true);
    api.get("/student/announcements")
      .then((r) => setAnnouncements(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

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
          <h2 className="text-2xl font-bold text-white">公告通知</h2>
          <p className="text-sm text-white/50 mt-1">查看系统发布的最新公告</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/40">
            <Megaphone className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">暂无公告</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a, idx) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              >
                <Card className={`border-0 shadow-lg shadow-black/20 transition-shadow hover:shadow-md ${a.is_pinned ? "ring-1 ring-indigo-200" : ""}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Megaphone className={`w-4 h-4 flex-shrink-0 ${a.is_pinned ? "text-indigo-500" : "text-white/40"}`} />
                        <CardTitle className="text-base truncate">{a.title}</CardTitle>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {a.is_pinned ? <Badge variant="default">置顶</Badge> : null}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-white/60 whitespace-pre-wrap">{a.content}</p>
                    <p className="text-xs text-white/40 mt-3">{formatTime(a.created_at)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </PageTransition>
    </ModuleLayout>
  );
}
