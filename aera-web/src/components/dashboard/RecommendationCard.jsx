import React from "react";
import { Card } from "@/components/ui/card";
import { Sparkles, ShieldCheck, AlertCircle } from "lucide-react";

export default function RecommendationCard({ recommendation, loading }) {
  const isStructured =
    recommendation && typeof recommendation === "object" && recommendation.precautions;

  return (
    <Card className="relative overflow-hidden border border-border bg-gradient-to-br from-card via-sky-50/20 to-indigo-50/20 p-6 md:p-8 shadow-xs rounded-3xl">
      <div className="flex items-center space-x-2.5 mb-4">
        <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Aera AI Health Guidance
          </h3>
          <p className="text-xs text-muted-foreground">
            Dynamic precautions evaluated via Groq telemetry reasoning
          </p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3 py-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      ) : recommendation ? (
        <div className="space-y-4">
          {isStructured ? (
            <>
              {recommendation.summary && (
                <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                  {recommendation.summary}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {recommendation.precautions.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 bg-card/90 border border-border/80 p-3 rounded-2xl text-xs text-foreground/90 shadow-2xs"
                  >
                    <span className="text-sky-600 font-bold">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {recommendation.vulnerable_groups_warning && (
                <div className="flex items-center gap-2 pt-2 text-xs text-amber-700 bg-amber-50/80 border border-amber-200/80 p-2.5 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{recommendation.vulnerable_groups_warning}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm leading-relaxed text-foreground whitespace-pre-line">
              {recommendation}
            </div>
          )}

          <div className="flex items-center space-x-2 pt-4 border-t border-border/60 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Telemetry analyzed by Groq · Medical & lifestyle preventive suggestions</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-2">
          Syncing atmospheric coordinates to generate customized health precautions...
        </p>
      )}
    </Card>
  );
}