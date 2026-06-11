import { useState, useEffect, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageTransition from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import ModuleLayout from "@/components/ModuleLayout";
import api from "@/lib/api";

interface Utility {
  id: number;
  dorm_number: string;
  billing_month: string;
  water_usage: number;
  electricity_usage: number;
  water_fee: number;
  electricity_fee: number;
  total_fee: number;
  is_paid: number;
  created_at: string;
}

export default function Utility() {
  const [records, setRecords] = useState<Utility[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(() => {
    setLoading(true);
    api.get("/student/utility")
      .then((r) => setRecords(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  return (
    <ModuleLayout>
      <PageTransition>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">水电账单</h2>
          <p className="text-sm text-white/50 mt-1">查看本宿舍的水电用量和费用明细</p>
        </div>

        <Card className="border-0 shadow-lg shadow-black/20">
          <CardHeader>
            <CardTitle className="text-base">账单记录</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3 p-4">
                {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-white/40">
                <p className="text-sm">暂无账单记录</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>宿舍号</TableHead>
                    <TableHead>用水量(吨)</TableHead>
                    <TableHead>用电量(度)</TableHead>
                    <TableHead>水费(元)</TableHead>
                    <TableHead>电费(元)</TableHead>
                    <TableHead>合计(元)</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>月份</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.dorm_number}</TableCell>
                      <TableCell>{r.water_usage}</TableCell>
                      <TableCell>{r.electricity_usage}</TableCell>
                      <TableCell>{r.water_fee.toFixed(2)}</TableCell>
                      <TableCell>{r.electricity_fee.toFixed(2)}</TableCell>
                      <TableCell className="font-semibold text-indigo-600">{r.total_fee.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={r.is_paid ? "default" : "secondary"}>
                          {r.is_paid ? "已缴费" : "未缴费"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white/50 text-xs">{r.billing_month || "-"}</TableCell>
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
