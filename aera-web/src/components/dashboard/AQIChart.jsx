import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatDate } from "@/lib/utils";

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-3 shadow-2xl backdrop-blur-md">
        <p className="text-xs text-slate-400 font-mono mb-2">
          {formatDate(data.timestamp || data.created_at)}
        </p>
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-sky-400">
            AQI: <span className="font-mono text-white">{data.aqi}</span>
          </p>
          <p className="text-slate-300">
            PM2.5: <span className="font-mono text-slate-100">{data.pm2_5} µg/m³</span>
          </p>
          <p className="text-slate-300">
            PM10: <span className="font-mono text-slate-100">{data.pm10} µg/m³</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
}

export default function AQIChart({ data = [] }) {
  const chartData = data.slice(-30).map((d) => ({
    ...d,
    timeLabel: formatDate(d.timestamp || d.created_at),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-500">
        Awaiting sensor data points to generate trend graph...
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">Atmospheric Trend</h3>
          <p className="text-xs text-slate-400">Real-time NAQI timeline</p>
        </div>
        <div className="flex items-center space-x-1.5 text-xs">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          <span className="text-slate-400">AQI Index</span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="aqiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, "dataMax + 40"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="aqi"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#aqiGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}