import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorState({
  title = "Telemetry Synchronization Failed",
  message = "Unable to establish communication with the Aera cloud gateway. Please verify your network connection or device status.",
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-card border border-rose-200/80 rounded-3xl shadow-xs">
      <div className="w-12 h-12 mb-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-muted/60 text-foreground text-xs font-semibold border border-border shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}