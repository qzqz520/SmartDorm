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

export default function AdminMonitor() {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket: Socket = io("/", { transports: ["websocket", "polling"] });
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("sensor_batch", (data: { sensors: SensorData[] }) => {
      setSensors(data.sensors || []);
    });
    socket.on("sensor_update", (d: SensorData) => {
      setSensors(prev => {
        const filtered = prev.filter(s => s.dorm_number !== d.dorm_number);
        return [...filtered, d].sort((a,b) => a.dorm_number.localeCompare(b.dorm_number));
      });
    });
    return () => { socket.disconnect(); };
  }, []);

  return (
    <ModuleLayout>
      <PageTransition>
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">📊 全部宿舍监控</h2>
          <p className="text-sm text-white/50 mt-1">
            {connected ? <span className="text-emerald-500">● 实时连接中</span> : <span className="text-red-400">● 连接断开</span>}
            <span className="ml-4">共 {sensors.length} 间宿舍</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map((d, i) => {
            const tempOk = d.temperature <= 30;
            const tempWarn = d.temperature > 30 && d.temperature <= 37;
            const tempHigh = d.temperature > 37;
            const smokeHigh = d.smoke > 50;

            return (
              <motion.div key={d.dorm_number} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.05 }}>
                <Card className={`border-0 shadow-lg shadow-black/20 ${smokeHigh ? "ring-2 ring-red-500" : ""}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-white">{d.dorm_number}</h3>
                      {smokeHigh && <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" /> 烟雾告警</Badge>}
                      {tempHigh && <Badge className="bg-red-100 text-red-700">高温</Badge>}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <Thermometer className={`w-5 h-5 mx-auto mb-1 ${tempHigh ? "text-red-500" : tempWarn ? "text-amber-500" : "text-emerald-500"}`} />
                        <p className="text-lg font-bold text-white">{d.temperature}°C</p>
                        <p className="text-[10px] text-white/40">温度</p>
                      </div>
                      <div>
                        <Droplets className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                        <p className="text-lg font-bold text-white">{d.humidity}%</p>
                        <p className="text-[10px] text-white/40">湿度</p>
                      </div>
                      <div>
                        <CloudFog className={`w-5 h-5 mx-auto mb-1 ${smokeHigh ? "text-red-500" : "text-white/40"}`} />
                        <p className={`text-lg font-bold ${smokeHigh ? "text-red-600" : "text-white"}`}>{d.smoke}</p>
                        <p className="text-[10px] text-white/40">烟雾</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {sensors.length === 0 && (
          <div className="text-center py-16 text-white/40">
            <p className="text-lg">暂无传感器数据</p>
            <p className="text-sm mt-2">等待数据推送中...</p>
          </div>
        )}
      </PageTransition>
    </ModuleLayout>
  );
}
