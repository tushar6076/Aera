import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorState({
  title = "Telemetry Synchronization Failed",
  message = "Unable to establish communication with the Aera cloud gateway. Please verify your network connection or device status.",
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 border border-rose-900/30 rounded-3xl backdrop-blur-xl">
      <div className="w-12 h-12 mb-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/40">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <h3 className="text-base font-bold text-slate-100">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all shadow-sm cursor-pointer hover:text-white"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}