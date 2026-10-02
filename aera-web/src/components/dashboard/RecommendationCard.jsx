// aera-web/src/components/dashboard/RecommendationCard.jsx
import React from "react";
import { Card } from "@/components/ui/card";
import { Sparkles, ShieldCheck, AlertCircle } from "lucide-react";

export default function RecommendationCard({ recommendation, loading }) {
  const isStructured =
    recommendation && typeof recommendation === "object" && recommendation.precautions;

  return (
    <Card className="relative overflow-hidden border border-border bg-card p-6 md:p-8 shadow-xs rounded-3xl">
      {/* Background radial gradient accent */}
      <div
        className="pointer-events-none absolute -right-24 -bottom-24 w-80 h-80 rounded-full blur-3xl opacity-20"
        style={{
          background: "radial-gradient(circle, var(--chart-2) 0%, var(--primary) 100%)",
        }}
      />

      <div className="flex items-center space-x-2.5 mb-4 relative z-10">
        <div
          className="p-2 rounded-xl border"
          style={{
            backgroundColor: "var(--accent)",
            borderColor: "var(--primary-light)",
            color: "var(--primary)",
          }}
        >
          <Sparkles className="w-4 h-4 text-primary" />
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
        <div className="animate-pulse space-y-3 py-3 relative z-10">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      ) : recommendation ? (
        <div className="space-y-4 relative z-10">
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
                    className="flex items-start gap-2 bg-muted/40 border border-border p-3 rounded-2xl text-xs text-foreground shadow-2xs"
                  >
                    <span className="text-primary font-bold">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {recommendation.vulnerable_groups_warning && (
                <div
                  className="flex items-center gap-2 pt-2 text-xs p-2.5 rounded-xl border"
                  style={{
                    backgroundColor: "oklch(0.96 0.06 65)",
                    borderColor: "oklch(0.88 0.1 65)",
                    color: "var(--chart-4)",
                  }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "var(--chart-4)" }} />
                  <span>{recommendation.vulnerable_groups_warning}</span>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm leading-relaxed text-foreground whitespace-pre-line">
              {recommendation}
            </div>
          )}

          <div className="flex items-center space-x-2 pt-4 border-t border-border text-[11px] text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Telemetry analyzed by Groq · Medical & lifestyle preventive suggestions</span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-2 relative z-10">
          Syncing atmospheric coordinates to generate customized health precautions...
        </p>
      )}
    </Card>
  );
}