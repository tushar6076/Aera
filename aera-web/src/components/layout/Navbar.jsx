import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wind, UserCheck, History, Sliders } from "lucide-react";

export default function Navbar({ onOpenPanel, isConnected = true, activePanel = null }) {
  const { user } = useAuth();
  const userInitial =
    user?.full_name?.charAt(0).toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    "A";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 sm:px-8 backdrop-blur-xl">
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
          <Wind className="w-5 h-5" />
        </div>
        <span className="text-lg font-black tracking-tight text-white font-mono">
          AERA<span className="text-sky-400">.</span>
        </span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        <Badge
          variant="outline"
          className="hidden sm:inline-flex items-center gap-1.5 border-slate-800 bg-slate-900/60 text-[11px] text-slate-300 font-mono py-1 px-2.5"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
            }`}
          />
          {isConnected ? "Live Stream" : "Connecting"}
        </Badge>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onOpenPanel("overview")}
          className={`h-9 w-9 rounded-xl border-slate-800 bg-slate-900/60 ${
            activePanel === "overview"
              ? "border-sky-500 text-sky-400"
              : "text-slate-400 hover:text-white"
          }`}
          title="Overview & Vitals"
        >
          <UserCheck className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onOpenPanel("history")}
          className={`h-9 w-9 rounded-xl border-slate-800 bg-slate-900/60 ${
            activePanel === "history"
              ? "border-sky-500 text-sky-400"
              : "text-slate-400 hover:text-white"
          }`}
          title="Telemetry History"
        >
          <History className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onOpenPanel("settings")}
          className={`h-9 w-9 rounded-xl border-slate-800 bg-slate-900/60 ${
            activePanel === "settings"
              ? "border-sky-500 text-sky-400"
              : "text-slate-400 hover:text-white"
          }`}
          title="System Settings"
        >
          <Sliders className="w-4 h-4" />
        </Button>

        {user && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenPanel("overview")}
            className="h-8 w-8 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 font-bold text-xs ml-1"
          >
            {userInitial}
          </Button>
        )}
      </div>
    </header>
  );
}