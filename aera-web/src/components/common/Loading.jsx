import React from "react";

export default function Loading({ message = "Gathering atmospheric telemetry..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
      <div className="w-10 h-10 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin" />
      <p className="text-sm font-medium text-slate-400">{message}</p>
    </div>
  );
}