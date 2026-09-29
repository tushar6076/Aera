import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function HistoryPanel({ deviceContext }) {
  const { history = [], selectedDevice } = deviceContext;
  const [filterLimit] = useState(30);

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
    if (aqi === null || aqi === undefined) return "bg-sky-50 text-sky-700 border-sky-200";
    if (aqi <= 50) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (aqi <= 100) return "bg-sky-50 text-sky-700 border-sky-200";
    if (aqi <= 150) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-rose-50 text-rose-700 border-rose-200";
  };

  const exportCSV = () => {
    if (!history.length) return;
    const headers = "Timestamp,AQI,Category,PM2.5,PM10,Temperature,Humidity\n";
    const rows = history
      .map(
        (r) =>
          `"${r.created_at || r.timestamp}",${r.aqi ?? ""},"${r.category || ""}",${r.pm2_5 ?? ""},${r.pm10 ?? ""},${r.temperature ?? ""},${r.humidity ?? ""}`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aera_${selectedDevice?.id || "ambient"}_logs.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-border/80">
        <div>
          <h3 className="text-sm font-bold text-foreground">Telemetry Archive</h3>
          <p className="text-xs text-muted-foreground">Archived atmospheric snapshots</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          disabled={history.length === 0}
          className="h-8 text-xs border-border bg-card text-foreground hover:bg-muted/60 gap-1.5 cursor-pointer shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-sky-600" />
          <span>Export CSV</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border border-border bg-card p-3.5 rounded-2xl shadow-2xs">
          <span className="text-[11px] text-muted-foreground uppercase font-semibold">
            Peak AQI Today
          </span>
          <p className="text-2xl font-black text-foreground font-mono mt-1">
            {peakAQI}
          </p>
        </Card>
        <Card className="border border-border bg-card p-3.5 rounded-2xl shadow-2xs">
          <span className="text-[11px] text-muted-foreground uppercase font-semibold">
            Avg PM2.5
          </span>
          <p className="text-2xl font-black text-foreground font-mono mt-1">
            {avgPM25} <span className="text-xs text-muted-foreground font-sans font-normal">µg/m³</span>
          </p>
        </Card>
      </div>

      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Recent Log Stream ({history.length})
        </span>

        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center border border-dashed border-border rounded-2xl">
            Awaiting sensor telemetry packets...
          </p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {[...history].reverse().slice(0, filterLimit).map((r, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl border border-border bg-card hover:bg-muted/20 flex items-center justify-between text-xs shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground text-sm">
                      {r.aqi !== undefined && r.aqi !== null ? `AQI ${r.aqi}` : "PM Point"}
                    </span>
                    {r.category && (
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0.5 font-sans font-medium border ${getBadgeStyle(r.aqi)}`}
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
                  <p>PM2.5: <span className="text-foreground">{r.pm2_5 ?? "--"}</span> µg/m³</p>
                  <p>PM10: <span className="text-foreground">{r.pm10 ?? "--"}</span> µg/m³</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}