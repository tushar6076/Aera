import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAQIColor } from "@/lib/utils";
import { Download } from "lucide-react";

export default function HistoryPanel({ deviceContext }) {
  const { history = [], selectedDevice } = deviceContext;
  const [filterLimit] = useState(30);

  const validReadings = history.filter((r) => r.aqi !== undefined);
  const peakAQI = validReadings.length
    ? Math.max(...validReadings.map((r) => r.aqi))
    : "--";
  const avgPM25 = validReadings.length
    ? (
        validReadings.reduce((sum, r) => sum + (r.pm2_5 || 0), 0) /
        validReadings.length
      ).toFixed(1)
    : "--";

  const exportCSV = () => {
    if (!history.length) return;
    const headers = "Timestamp,AQI,Category,PM2.5,PM10,Temperature,Humidity\n";
    const rows = history
      .map(
        (r) =>
          `"${r.created_at || r.timestamp}",${r.aqi},"${r.category}",${r.pm2_5},${r.pm10},${r.temperature ?? ""},${r.humidity ?? ""}`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aera_${selectedDevice?.id}_logs.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white">Telemetry Archive</h3>
          <p className="text-xs text-slate-400">Archived sensor snapshots</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCSV}
          disabled={history.length === 0}
          className="h-8 text-xs border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-sky-400" />
          <span>Export CSV</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-slate-800 bg-slate-950/60 p-3">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">
            Peak AQI Today
          </span>
          <p className="text-2xl font-black text-white font-mono mt-1">
            {peakAQI}
          </p>
        </Card>
        <Card className="border-slate-800 bg-slate-950/60 p-3">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">
            Avg PM2.5
          </span>
          <p className="text-2xl font-black text-white font-mono mt-1">
            {avgPM25} <span className="text-xs text-slate-500 font-sans">µg/m³</span>
          </p>
        </Card>
      </div>

      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Recent Log Stream ({history.length})
        </span>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center border border-dashed border-slate-800 rounded-2xl">
            Awaiting sensor telemetry packets...
          </p>
        ) : (
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {[...history].reverse().slice(0, filterLimit).map((r, idx) => {
              const color = getAQIColor(r.aqi);
              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl border border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">
                        AQI {r.aqi}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0.2 font-sans ${color.border} ${color.text} bg-slate-950`}
                      >
                        {r.category}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      {new Date(r.created_at || r.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                  </div>

                  <div className="text-right font-mono text-[11px] space-y-0.5 text-slate-400">
                    <p>PM2.5: {r.pm2_5} µg/m³</p>
                    <p>PM10: {r.pm10} µg/m³</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}