// aera-web/src/components/dashboard/OutdoorStatus.jsx
import React from "react";
import { Card } from "@/components/ui/card";
import { CloudSun, Wind, Eye } from "lucide-react";

export default function OutdoorStatus({ reading, weatherMetrics }) {
  const pm2_5 = reading?.pm2_5 ?? 0;
  const windSpeed = weatherMetrics?.wind_speed ?? reading?.wind_speed ?? 12;

  const visibilityEstimate = Math.max(1, (10 - pm2_5 / 35)).toFixed(1);
  const dispersionRating =
    pm2_5 > 120 ? "Low" : pm2_5 > 60 ? "Moderate" : "Optimal";

  const getDispersionStyle = () => {
    if (dispersionRating === "Optimal") {
      return {
        backgroundColor: "var(--accent)",
        borderColor: "var(--primary-light)",
        color: "var(--chart-3)",
      };
    }
    if (dispersionRating === "Moderate") {
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

  return (
    <Card className="border border-border bg-card p-6 shadow-xs rounded-3xl h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center space-x-2.5 mb-4">
          <div
            className="p-2 rounded-xl border"
            style={{
              backgroundColor: "var(--accent)",
              borderColor: "var(--primary-light)",
              color: "var(--chart-3)",
            }}
          >
            <CloudSun className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">
              Dispersion & Ventilation
            </h4>
            <p className="text-xs text-muted-foreground">Ambient atmosphere physics</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-2xl bg-muted/40 border border-border">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span>Visibility</span>
            </div>
            <p className="text-lg font-bold text-foreground font-mono">
              {visibilityEstimate} km
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-muted/40 border border-border">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <Wind className="w-3.5 h-3.5" style={{ color: "var(--chart-3)" }} />
              <span>Windflow</span>
            </div>
            <p className="text-lg font-bold text-foreground font-mono">
              {windSpeed} <span className="text-xs font-normal text-muted-foreground">km/h</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>Circulation Rate</span>
        <span
          className="font-semibold px-2 py-0.5 rounded-md border text-xs"
          style={getDispersionStyle()}
        >
          {dispersionRating}
        </span>
      </div>
    </Card>
  );
}