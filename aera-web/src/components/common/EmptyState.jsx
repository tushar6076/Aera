import React from "react";

export default function EmptyState({
  title = "No Data Found",
  description = "No sensor readings registered yet.",
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/50 border border-slate-800 rounded-3xl">
      <div className="w-12 h-12 mb-3 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 text-xl">
        ☁️
      </div>
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mt-1">{description}</p>
    </div>
  );
}