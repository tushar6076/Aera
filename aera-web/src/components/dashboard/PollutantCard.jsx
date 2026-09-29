import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wind, Gauge } from "lucide-react";

export default function PollutantCard({ pm2_5 = 0, pm10 = 0 }) {
  const pm25Percentage = Math.min(Math.round((pm2_5 / 60) * 100), 100);
  const pm10Percentage = Math.min(Math.round((pm10 / 100) * 100), 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* PM2.5 Card */}
      <Card className="border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">PM2.5</h4>
              <p className="text-xs text-slate-500">Fine particles</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">Limit: 60 µg/m³</span>
        </div>

        <div className="mt-6 flex items-baseline justify-between">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-white font-mono">
              {pm2_5 !== undefined ? pm2_5 : "--"}
            </span>
            <span className="text-xs text-slate-400 font-medium">µg/m³</span>
          </div>
          <Badge
            variant="outline"
            className={`text-xs font-semibold ${
              pm25Percentage > 100
                ? "border-amber-500/30 text-amber-400 bg-amber-950/20"
                : "border-emerald-500/30 text-emerald-400 bg-emerald-950/20"
            }`}
          >
            {pm25Percentage}% limit
          </Badge>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pm2_5 <= 30
                ? "bg-emerald-500"
                : pm2_5 <= 60
                ? "bg-green-500"
                : pm2_5 <= 90
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${Math.min((pm2_5 / 150) * 100, 100)}%` }}
          />
        </div>
      </Card>

      {/* PM10 Card */}
      <Card className="border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-200">PM10</h4>
              <p className="text-xs text-slate-500">Coarse particles</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">Limit: 100 µg/m³</span>
        </div>

        <div className="mt-6 flex items-baseline justify-between">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-white font-mono">
              {pm10 !== undefined ? pm10 : "--"}
            </span>
            <span className="text-xs text-slate-400 font-medium">µg/m³</span>
          </div>
          <Badge
            variant="outline"
            className={`text-xs font-semibold ${
              pm10Percentage > 100
                ? "border-amber-500/30 text-amber-400 bg-amber-950/20"
                : "border-emerald-500/30 text-emerald-400 bg-emerald-950/20"
            }`}
          >
            {pm10Percentage}% limit
          </Badge>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              pm10 <= 50
                ? "bg-emerald-500"
                : pm10 <= 100
                ? "bg-green-500"
                : pm10 <= 250
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${Math.min((pm10 / 250) * 100, 100)}%` }}
          />
        </div>
      </Card>
    </div>
  );
}