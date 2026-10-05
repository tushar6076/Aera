// aera-web/src/components/dashboard/AQIChart.jsx
import React, { useState } from "react";
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
import { AlertCircle } from "lucide-react";

const METRICS = [
  { key: "aqi", label: "AQI", unit: "", subtitle: "Composite air quality index curve" },
  { key: "co", label: "CO (MQ-9)", unit: "PPM", subtitle: "Carbon monoxide concentration trace" },
  { key: "pm2_5", label: "PM2.5", unit: "µg/m³", subtitle: "Fine inhalable particle concentration" },
  { key: "pm10", label: "PM10", unit: "µg/m³", subtitle: "Coarse particulate matter flow" },
];

function CustomTooltip({ active, payload, activeMetricObj }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isValMissing = data[activeMetricObj.key] === null || data[activeMetricObj.key] === undefined;

    return (
      <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xl space-y-1.5 min-w-[160px]">
        <p className="text-[11px] text-muted-foreground font-mono pb-1 border-b border-border">
          {formatDate(data.timestamp || data.created_at)}
        </p>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">{activeMetricObj.label}:</span>
          <span className="font-mono font-bold text-primary">
            {isValMissing || Number(data[activeMetricObj.key]) === 0
              ? "0 " + activeMetricObj.unit
              : `${Number(data[activeMetricObj.key]).toFixed(1)} ${activeMetricObj.unit}`.trim()}
          </span>
        </div>

        {/* Supplementary readings */}
        <div className="pt-1.5 border-t border-border space-y-1 text-[11px] text-muted-foreground">
          {activeMetricObj.key !== "aqi" && data.aqi !== undefined && data.aqi !== null && (
            <div className="flex justify-between">
              <span>AQI:</span>
              <span className="font-mono text-foreground">{data.aqi}</span>
            </div>
          )}
          {activeMetricObj.key !== "co" && data.co !== undefined && data.co !== null && (
            <div className="flex justify-between">
              <span>CO:</span>
              <span className="font-mono text-foreground">{Number(data.co).toFixed(1)} PPM</span>
            </div>
          )}
          {data.temperature !== undefined && data.temperature !== null && (
            <div className="flex justify-between">
              <span>Temp / Hum:</span>
              <span className="font-mono text-foreground">
                {data.temperature}°C · {data.humidity}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export default function AQIChart({ data = [] }) {
  const [activeMetric, setActiveMetric] = useState("aqi");

  const currentMetricObj = METRICS.find((m) => m.key === activeMetric) || METRICS[0];

  const chartData = data.slice(-30).map((d) => ({
    ...d,
    timeLabel: formatDate(d.timestamp || d.created_at),
    aqi: d.aqi ?? 0,
    co: d.co ?? 0,
    pm2_5: d.pm2_5 ?? d.pm25 ?? 0,
    pm10: d.pm10 ?? 0,
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-border bg-card p-6 text-xs text-muted-foreground">
        Gathering telemetry sequence to plot atmospheric curve...
      </div>
    );
  }

  // Check if all plotted values for the active metric are zero or null/undefined
  const isMetricUnavailable = chartData.every((item) => {
    const val = item[currentMetricObj.key];
    return val === null || val === undefined || Number(val) === 0;
  });

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-xs">
      {/* Chart Header & Metric Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Atmospheric Trend</h3>
          <p className="text-xs text-muted-foreground">{currentMetricObj.subtitle}</p>
        </div>

        {/* 4-Way Metric Toggle Button Group */}
        <div className="flex items-center flex-wrap gap-1 p-1 rounded-2xl bg-muted/50 border border-border">
          {METRICS.map((m) => {
            const isSelected = activeMetric === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setActiveMetric(m.key)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-card text-primary shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="relative h-64 w-full">
        {/* Unavailable Sensor Watermark Overlay */}
        {isMetricUnavailable && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card/65 backdrop-blur-[2px] rounded-2xl text-center p-4">
            <div className="p-2.5 rounded-2xl bg-muted/80 border border-border text-muted-foreground mb-2">
              <AlertCircle className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              {currentMetricObj.label} Sensor Reading Unavailable
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs mt-0.5">
              {activeMetric.startsWith("pm")
                ? "No optical particulate transducer detected on this hardware station."
                : "No telemetry reported across the current sample window."}
            </p>
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="timeLabel"
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, (dataMax) => (dataMax > 0 ? dataMax + 10 : 50)]}
            />
            <Tooltip content={<CustomTooltip activeMetricObj={currentMetricObj} />} />
            <Area
              type="monotone"
              dataKey={currentMetricObj.key}
              stroke="var(--chart-1)"
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