import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wind, Activity } from "lucide-react";

export default function PollutantCard({ pm2_5 = 0, pm10 = 0 }) {
  const safePm25 = pm2_5 ?? 0;
  const safePm10 = pm10 ?? 0;

  const pm25Percentage = Math.min(Math.round((safePm25 / 60) * 100), 100);
  const pm10Percentage = Math.min(Math.round((safePm10 / 100) * 100), 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* PM2.5 Card */}
      <Card className="border border-border bg-card p-6 shadow-xs rounded-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Wind className="w-4 h-4" />
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
            className={`text-xs font-semibold px-2 py-0.5 ${
              safePm25 > 60
                ? "border-amber-200 text-amber-700 bg-amber-50"
                : "border-emerald-200 text-emerald-700 bg-emerald-50"
            }`}
          >
            {pm25Percentage}% limit
          </Badge>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              safePm25 <= 30
                ? "bg-emerald-500"
                : safePm25 <= 60
                ? "bg-sky-500"
                : safePm25 <= 90
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
            style={{ width: `${Math.min((safePm25 / 150) * 100, 100)}%` }}
          />
        </div>
      </Card>

      {/* PM10 Card */}
      <Card className="border border-border bg-card p-6 shadow-xs rounded-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Activity className="w-4 h-4" />
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
            className={`text-xs font-semibold px-2 py-0.5 ${
              safePm10 > 100
                ? "border-amber-200 text-amber-700 bg-amber-50"
                : "border-emerald-200 text-emerald-700 bg-emerald-50"
            }`}
          >
            {pm10Percentage}% limit
          </Badge>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              safePm10 <= 50
                ? "bg-emerald-500"
                : safePm10 <= 100
                ? "bg-sky-500"
                : safePm10 <= 250
                ? "bg-amber-500"
                : "bg-rose-500"
            }`}
            style={{ width: `${Math.min((safePm10 / 250) * 100, 100)}%` }}
          />
        </div>
      </Card>
    </div>
  );
}