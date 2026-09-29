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
      <div className="rounded-2xl border border-border bg-card p-3 shadow-lg">
        <p className="text-xs text-muted-foreground font-mono mb-2">
          {formatDate(data.timestamp || data.created_at)}
        </p>
        <div className="space-y-1 text-xs">
          {data.aqi !== undefined && (
            <p className="font-semibold text-sky-600">
              AQI: <span className="font-mono text-foreground">{data.aqi}</span>
            </p>
          )}
          <p className="text-muted-foreground">
            PM2.5: <span className="font-mono text-foreground">{data.pm2_5} µg/m³</span>
          </p>
          <p className="text-muted-foreground">
            PM10: <span className="font-mono text-foreground">{data.pm10} µg/m³</span>
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
      <div className="flex h-64 items-center justify-center rounded-3xl border border-border bg-card p-6 text-xs text-muted-foreground">
        Gathering telemetry sequence to plot atmospheric curve...
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Atmospheric Trend</h3>
          <p className="text-xs text-muted-foreground">Historical particulate curve</p>
        </div>
        <div className="flex items-center space-x-1.5 text-xs">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          <span className="text-muted-foreground">PM2.5 Particle Flow</span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, "dataMax + 20"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="pm2_5"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#chartGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}