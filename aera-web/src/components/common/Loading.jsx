import React from "react";

export default function Loading({ message = "Gathering atmospheric telemetry..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
      <div className="w-10 h-10 border-3 border-sky-100 border-t-sky-600 rounded-full animate-spin" />
      <p className="text-xs font-medium text-muted-foreground">{message}</p>
    </div>
  );
}