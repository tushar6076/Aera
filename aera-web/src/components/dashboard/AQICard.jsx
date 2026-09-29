import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Thermometer, Droplets, Wifi, Compass, Sparkles } from "lucide-react";

export default function AQICard({ reading, isConnected, isHardwareActive, locationName }) {
  if (!reading) return null;

  const { aqi, category, temperature, humidity, timestamp, created_at } = reading;

  // Cool-toned dynamic badge styling
  const getBadgeStyle = (val) => {
    if (val === null || val === undefined) return "bg-sky-50 text-sky-700 border-sky-200";
    if (val <= 50) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (val <= 100) return "bg-sky-50 text-sky-700 border-sky-200";
    if (val <= 150) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  return (
    <Card className="relative overflow-hidden border border-border bg-card p-6 md:p-8 shadow-xs rounded-3xl">
      {/* Soft Ambient Cool Glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-100/50 blur-3xl" />

      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-border/60">
        <div className="flex items-center gap-2">
          {isHardwareActive ? (
            <Badge
              variant="outline"
              className="flex items-center gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 font-medium"
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>Aera Node Pro Active</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="flex items-center gap-1.5 border-sky-200 bg-sky-50 text-sky-700 text-xs px-2.5 py-1 font-medium"
            >
              <Compass className="w-3.5 h-3.5 text-sky-600" />
              <span>Ambient Regional Grid · {locationName || "Local Area"}</span>
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          Updated {formatDate(timestamp || created_at || new Date().toISOString())}
        </span>
      </div>

      {/* Main Stats */}
      <div className="mt-8 flex flex-col md:flex-row md:items-baseline md:justify-between gap-6 relative z-10">
        <div>
          <div className="flex items-baseline space-x-4">
            <span className="text-6xl md:text-8xl font-black tracking-tight text-foreground font-mono">
              {aqi ?? "--"}
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Air Quality Index
              </span>
              <Badge
                variant="outline"
                className={`mt-1.5 text-xs font-semibold px-2.5 py-0.5 border ${getBadgeStyle(aqi)}`}
              >
                {category || "Analyzing"}
              </Badge>
            </div>
          </div>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
            {aqi === null || aqi === undefined
              ? "Synthesizing atmospheric telemetry..."
              : aqi <= 50
              ? "Air quality is ideal. Conditions are clean and safe for all outdoor activities."
              : aqi <= 100
              ? "Air quality is moderate. Sensitive individuals should reduce excessive outdoor exertion."
              : aqi <= 150
              ? "Unhealthy for sensitive groups. Consider wearing a mask during peak traffic."
              : "High air pollution. Indoor HEPA purification and minimal outdoor exposure advised."}
          </p>
        </div>

        {/* Quick Ambient Gauges */}
        <div className="grid grid-cols-2 gap-3 min-w-[220px]">
          <div className="rounded-2xl border border-border/80 bg-muted/30 p-4">
            <div className="flex items-center space-x-2 text-muted-foreground text-xs">
              <Thermometer className="w-4 h-4 text-sky-600" />
              <span className="font-medium">Temperature</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground font-mono">
              {temperature !== null && temperature !== undefined ? `${Math.round(temperature)}°C` : "--"}
            </p>
            <span className="text-[10px] text-muted-foreground">Thermal Level</span>
          </div>

          <div className="rounded-2xl border border-border/80 bg-muted/30 p-4">
            <div className="flex items-center space-x-2 text-muted-foreground text-xs">
              <Droplets className="w-4 h-4 text-indigo-600" />
              <span className="font-medium">Humidity</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-foreground font-mono">
              {humidity !== null && humidity !== undefined ? `${Math.round(humidity)}%` : "--"}
            </p>
            <span className="text-[10px] text-muted-foreground">Relative Saturation</span>
          </div>
        </div>
      </div>
    </Card>
  );
}