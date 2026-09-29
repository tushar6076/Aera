import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAQIColor, formatDate } from "@/lib/utils";
import { Thermometer, Droplets, Wifi, WifiOff } from "lucide-react";

export default function AQICard({ reading, isConnected }) {
  if (!reading) return null;

  const { aqi, category, temperature, humidity, timestamp } = reading;
  const color = getAQIColor(aqi);

  return (
    <Card className="relative overflow-hidden border-slate-800 bg-slate-900/80 p-6 md:p-8 backdrop-blur-xl shadow-xl shadow-slate-950/40">
      <div
        className={`pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20 blur-3xl transition-colors duration-700 ${color.bg}`}
      />

      <div className="flex items-center justify-between pb-6 border-b border-slate-800/60">
        <div className="flex items-center space-x-2.5">
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 border-slate-800 bg-slate-950/60 text-xs px-2.5 py-1"
          >
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-mono">Live Stream</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400 font-mono">Connecting</span>
              </>
            )}
          </Badge>
        </div>
        <span className="text-xs text-slate-500 font-mono">
          Updated {formatDate(timestamp)}
        </span>
      </div>

      <div className="mt-8 flex flex-col md:flex-row md:items-baseline md:justify-between gap-6">
        <div>
          <div className="flex items-baseline space-x-4">
            <span className="text-6xl md:text-8xl font-black tracking-tight text-white font-mono">
              {aqi ?? "--"}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-400">
                India NAQI
              </span>
              <Badge
                variant="outline"
                className={`mt-1 text-xs font-semibold ${color.border} ${color.text} bg-slate-950/60`}
              >
                {category || "Calibrating"}
              </Badge>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-400 max-w-sm">
            {aqi <= 100
              ? "Air quality is acceptable. Minimal health impact for the general public."
              : aqi <= 200
              ? "Sensitive individuals may experience minor breathing discomfort."
              : "Significant respiratory impact. High-efficiency indoor filtration advised."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 min-w-[200px]">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3.5">
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <span>Temp</span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-100 font-mono">
              {temperature !== null && temperature !== undefined
                ? `${temperature}°C`
                : "--"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3.5">
            <div className="flex items-center space-x-2 text-slate-400 text-xs">
              <Droplets className="w-4 h-4 text-sky-400" />
              <span>Humidity</span>
            </div>
            <p className="mt-1 text-xl font-bold text-slate-100 font-mono">
              {humidity !== null && humidity !== undefined ? `${humidity}%` : "--"}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}