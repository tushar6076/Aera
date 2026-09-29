import React from "react";
import { Card } from "@/components/ui/card";
import { CloudSun, Wind, Eye } from "lucide-react";

export default function OutdoorStatus({ reading }) {
  const pm2_5 = reading?.pm2_5 ?? 0;
  
  const visibilityEstimate = Math.max(1, (10 - pm2_5 / 35).toFixed(1));
  const dispersionRating =
    pm2_5 > 120 ? "Low" : pm2_5 > 60 ? "Moderate" : "Optimal";

  return (
    <Card className="border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl">
      <div className="flex items-center space-x-2.5 mb-4">
        <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
          <CloudSun className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-200">
            Outdoor Dispersion
          </h4>
          <p className="text-xs text-slate-500">Local ambient conditions</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>Est. Visibility</span>
          </div>
          <p className="text-lg font-bold text-white font-mono">
            {visibilityEstimate} km
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Wind className="w-3.5 h-3.5 text-indigo-400" />
            <span>Airflow</span>
          </div>
          <p className="text-lg font-bold text-white font-mono">
            {dispersionRating}
          </p>
        </div>
      </div>
    </Card>
  );
}