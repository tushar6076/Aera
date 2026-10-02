// aera-web/src/components/dashboard/PollutantCard.jsx
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wind, Activity } from "lucide-react";

export default function PollutantCard({ pm2_5 = 0, pm10 = 0 }) {
  const safePm25 = pm2_5 ?? 0;
  const safePm10 = pm10 ?? 0;

  const pm25Percentage = Math.min(Math.round((safePm25 / 60) * 100), 100);
  const pm10Percentage = Math.min(Math.round((safePm10 / 100) * 100), 100);

  const getLimitBadgeStyle = (isExceeded) => {
    if (isExceeded) {
      return {
        backgroundColor: "oklch(0.96 0.06 65)",
        borderColor: "oklch(0.88 0.1 65)",
        color: "var(--chart-4)",
      };
    }
    return {
      backgroundColor: "var(--accent)",
      borderColor: "var(--primary-light)",
      color: "var(--chart-3)",
    };
  };

  const getBarColor = (val, thresholds) => {
    if (val <= thresholds[0]) return "var(--chart-3)";
    if (val <= thresholds[1]) return "var(--chart-1)";
    if (val <= thresholds[2]) return "var(--chart-4)";
    return "var(--chart-5)";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* PM2.5 Card */}
      <Card className="border border-border bg-card p-6 shadow-xs rounded-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className="p-2 rounded-xl border"
              style={{
                backgroundColor: "var(--accent)",
                borderColor: "var(--primary-light)",
                color: "var(--primary)",
              }}
            >
              <Wind className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">PM 2.5</h4>
              <p className="text-xs text-muted-foreground">Fine inhalable particles</p>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">Target: ≤ 60 µg/m³</span>
        </div>

        <div className="mt-6 flex items-baseline justify-between">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-foreground font-mono">
              {safePm25}
            </span>
            <span className="text-xs text-muted-foreground font-medium">µg/m³</span>
          </div>
          <Badge
            variant="outline"
            className="text-xs font-semibold px-2 py-0.5 border"
            style={getLimitBadgeStyle(safePm25 > 60)}
          >
            {pm25Percentage}% limit
          </Badge>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min((safePm25 / 150) * 100, 100)}%`,
              backgroundColor: getBarColor(safePm25, [30, 60, 90]),
            }}
          />
        </div>
      </Card>

      {/* PM10 Card */}
      <Card className="border border-border bg-card p-6 shadow-xs rounded-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div
              className="p-2 rounded-xl border"
              style={{
                backgroundColor: "var(--accent)",
                borderColor: "var(--primary-light)",
                color: "var(--chart-2)",
              }}
            >
              <Activity className="w-4 h-4" style={{ color: "var(--chart-2)" }} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">PM 10</h4>
              <p className="text-xs text-muted-foreground">Coarse dust & pollutants</p>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">Target: ≤ 100 µg/m³</span>
        </div>

        <div className="mt-6 flex items-baseline justify-between">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-foreground font-mono">
              {safePm10}
            </span>
            <span className="text-xs text-muted-foreground font-medium">µg/m³</span>
          </div>
          <Badge
            variant="outline"
            className="text-xs font-semibold px-2 py-0.5 border"
            style={getLimitBadgeStyle(safePm10 > 100)}
          >
            {pm10Percentage}% limit
          </Badge>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min((safePm10 / 250) * 100, 100)}%`,
              backgroundColor: getBarColor(safePm10, [50, 100, 250]),
            }}
          />
        </div>
      </Card>
    </div>
  );
}