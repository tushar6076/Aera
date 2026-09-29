import React from "react";
import { Card } from "@/components/ui/card";
import { Sparkles, ShieldCheck } from "lucide-react";

export default function RecommendationCard({ recommendation, loading }) {
  return (
    <Card className="relative overflow-hidden border-slate-800 bg-slate-900/60 p-6 md:p-8 backdrop-blur-xl">
      <div className="flex items-center space-x-2.5 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-lg shadow-sky-500/20">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">
            Aera AI Health Advisor
          </h3>
          <p className="text-xs text-slate-400">Contextual precautions & lifestyle guidance</p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3 py-3">
          <div className="h-4 bg-slate-800 rounded w-3/4"></div>
          <div className="h-4 bg-slate-800 rounded w-5/6"></div>
          <div className="h-4 bg-slate-800 rounded w-1/2"></div>
        </div>
      ) : recommendation ? (
        <div className="space-y-4">
          <div className="text-sm leading-relaxed text-slate-300 whitespace-pre-line font-normal">
            {recommendation}
          </div>
          <div className="flex items-center space-x-2 pt-4 border-t border-slate-800/60 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Generated using Groq telemetry analysis · Lifestyle recommendations only</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 py-2">
          Syncing device readings to compute personalized recommendations...
        </p>
      )}
    </Card>
  );
}