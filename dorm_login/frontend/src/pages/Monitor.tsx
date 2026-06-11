import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { motion } from "framer-motion";
import { Thermometer, Droplets, CloudFog, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ModuleLayout from "@/components/ModuleLayout";
import PageTransition from "@/components/PageTransition";

interface SensorData {
  dorm_number: string;
  temperature: number;
  humidity: number;
  smoke: number;
  timestamp: string;
}

export default function Monitor() {
  const [data, setData] = useState<SensorData | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket: Socket = io("/", { transports: ["websocket", "polling"] });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("sensor_update", (d: SensorData) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (d.dorm_number === user.dorm_number || !user.dorm_number) {
        setData(d);
      }
    });
    return () => { socket.disconnect(); };
  }, []);

  const tempColor = (data?.temperature || 0) > 37 ? "text-red-500" : (data?.temperature || 0) > 30 ? "text-amber-500" : "text-emerald-500";
  const smokeAlert = (data?.smoke || 0) > 50;
  const tempHigh = (data?.temperature || 0) > 37;
  const tempWarn = (data?.temperature || 0) > 30 && (data?.temperature || 0) <= 37;

  return (
    <ModuleLayout>
      <PageTransition>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">🏠 宿舍环境监控</h2>
        <p className="text-sm text-white/50 mt-1">
          {connected ? <span className="text-emerald-500">● 实时连接中</span> : <span className="text-red-400">● 连接断开</span>}
        </p>
      </div>

      {smokeAlert && (
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-red-600 font-semibold text-sm">烟雾告警！当前烟雾值：{data?.smoke}，请立即检查！</span>
          <Badge variant="destructive" className="ml-auto">严重</Badge>
        </motion.div>
      )}

      {tempHigh && (
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <Thermometer className="w-5 h-5 text-red-500" />
          <span className="text-red-600 font-semibold text-sm">高温告警！当前温度：{data?.temperature}°C，超过37°C警戒线！</span>
          <Badge variant="destructive" className="ml-auto">严重</Badge>
        </motion.div>
      )}

      {tempWarn && !tempHigh && (
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <span className="text-amber-600 font-semibold text-sm">温度偏高：{data?.temperature}°C，请注意降温。</span>
          <Badge className="ml-auto bg-amber-100 text-amber-700">注意</Badge>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        {/* Temperature Card */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <Card className="border-0 shadow-lg shadow-black/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
                <Thermometer className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/50 font-medium">温度</p>
                <p className={`text-3xl font-bold ${tempColor}`}>{data?.temperature ?? "--"}°C</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Humidity Card */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
          <Card className="border-0 shadow-lg shadow-black/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Droplets className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/50 font-medium">湿度</p>
                <p className="text-3xl font-bold text-white">{data?.humidity ?? "--"}%</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Smoke Card */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
          <Card className={`border-0 shadow-lg shadow-black/20 ${smokeAlert ? "ring-2 ring-red-500" : ""}`}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${smokeAlert ? "bg-gradient-to-br from-red-500 to-orange-600 shadow-red-500/20" : "bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-500/20"}`}>
                <CloudFog className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/50 font-medium">烟雾</p>
                <p className={`text-3xl font-bold ${smokeAlert ? "text-red-600" : "text-white"}`}>{data?.smoke ?? "--"}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {data && (
        <Card className="border-0 shadow-lg shadow-black/20">
          <CardContent className="p-4 text-xs text-white/40">
            最后更新：{new Date(data.timestamp).toLocaleTimeString("zh-CN")} | 宿舍：{data.dorm_number}
          </CardContent>
        </Card>
      )}
      </PageTransition>
    </ModuleLayout>
  );
}
