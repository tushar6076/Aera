// aera-web/src/components/layout/panel/HistoryPanel.jsx
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Activity } from "lucide-react";

export default function HistoryPanel({ deviceContext }) {
  const { history = [], selectedDevice } = deviceContext;
  const [filterLimit] = useState(50);

  const validReadings = history.filter((r) => r.aqi !== undefined && r.aqi !== null);
  const peakAQI = validReadings.length
    ? Math.max(...validReadings.map((r) => r.aqi))
    : "--";
  const avgPM25 = validReadings.length
    ? (
        validReadings.reduce((sum, r) => sum + (r.pm2_5 || 0), 0) /
        validReadings.length
      ).toFixed(1)
    : "--";

  const getBadgeStyle = (aqi) => {
    if (aqi === null || aqi === undefined) {
      return {
        backgroundColor: "var(--accent)",
        borderColor: "var(--primary-light)",
        color: "var(--primary)",
      };
    }
    if (aqi <= 50) {
      return {
        backgroundColor: "oklch(0.96 0.05 150)",
        borderColor: "oklch(0.85 0.1 150)",
        color: "var(--chart-3)",
      };
    }
    if (aqi <= 100) {
      return {
        backgroundColor: "var(--accent)",
        borderColor: "var(--primary-light)",
        color: "var(--chart-1)",
      };
    }
    if (aqi <= 150) {
      return {
        backgroundColor: "oklch(0.96 0.06 65)",
        borderColor: "oklch(0.88 0.1 65)",
        color: "var(--chart-4)",
      };
    }
    return {
      backgroundColor: "oklch(0.96 0.06 25)",
      borderColor: "oklch(0.88 0.12 25)",
      color: "var(--chart-5)",
    };
  };

  const exportCSV = () => {
    if (!history.length) return;
    const headers = "Timestamp,AQI,Category,PM2.5,PM10,CO_PPM,Temperature,Humidity\n";
    const rows = history
      .map(
        (r) =>
          `"${r.created_at || r.timestamp}",${r.aqi ?? ""},"${r.category || ""}",${r.pm2_5 ?? ""},${r.pm10 ?? ""},${r.co ?? ""},${r.temperature ?? ""},${r.humidity ?? ""}`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aera_${selectedDevice?.id || "ambient"}_telemetry.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h3 className="text-sm font-bold text-foreground">Telemetry Archive</h3>
          <p className="text-xs text-muted-foreground">Historical air logs & sensor intervals</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          disabled={history.length === 0}
          className="h-8 text-xs font-semibold border-border bg-card text-foreground hover:bg-muted gap-1.5 shadow-xs rounded-xl cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-primary" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border border-border bg-card p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
            Peak AQI Today
          </span>
          <p className="text-2xl font-black text-foreground font-mono mt-1">
            {peakAQI}
          </p>
        </Card>
        <Card className="border border-border bg-card p-4 rounded-2xl shadow-xs">
          <span className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
            Avg PM2.5
          </span>
          <p className="text-2xl font-black text-foreground font-mono mt-1">
            {avgPM25} <span className="text-xs text-muted-foreground font-sans font-normal">µg/m³</span>
          </p>
        </Card>
      </div>

      {/* Stream Listing */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Recent Telemetry Sequence ({history.length})
          </span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border rounded-3xl bg-muted/30">
            <Activity className="w-6 h-6 text-muted-foreground mx-auto mb-2 animate-pulse" />
            <p className="text-xs text-foreground font-medium">
              Awaiting telemetry packets from active source...
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {[...history].reverse().slice(0, filterLimit).map((r, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-border bg-card hover:border-primary/40 flex items-center justify-between text-xs shadow-xs transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground text-sm">
                      {r.aqi !== undefined && r.aqi !== null ? `AQI ${r.aqi}` : "Particulate Log"}
                    </span>
                    {r.category && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0.5 font-sans font-semibold rounded-full border"
                        style={getBadgeStyle(r.aqi)}
                      >
                        {r.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono mt-1">
                    {new Date(r.created_at || r.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </p>
                </div>

                <div className="text-right font-mono text-[11px] space-y-0.5 text-muted-foreground">
                  <p>PM2.5: <span className="font-bold text-foreground">{r.pm2_5 ?? "--"}</span> µg/m³</p>
                  <p>PM10: <span className="font-bold text-foreground">{r.pm10 ?? "--"}</span> µg/m³</p>
                  {r.co !== undefined && r.co !== null && (
                    <p>CO: <span className="font-bold" style={{ color: "var(--chart-4)" }}>{r.co}</span> ppm</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}