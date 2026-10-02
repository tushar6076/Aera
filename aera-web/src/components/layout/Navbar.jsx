// aera-web/src/components/layout/Navbar.jsx
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/95 px-4 sm:px-8 backdrop-blur-md shadow-xs">
      {/* Brand: Clean 'AERA' without the trailing dot */}
      <Link to="/" className="flex items-center gap-2.5 group">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground shadow-xs group-hover:scale-105 transition-transform"
          style={{
            background: "linear-gradient(135deg, var(--chart-1) 0%, var(--chart-2) 100%)",
          }}
        >
          <Wind className="w-5 h-5" />
        </div>
        <span className="text-lg font-black tracking-tight text-foreground font-mono">
          AERA
        </span>
      </Link>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Connection status badge using chart tokens */}
        <Badge
          variant="outline"
          className="hidden sm:inline-flex items-center gap-1.5 border-border bg-muted/50 text-[11px] text-muted-foreground font-mono py-1 px-2.5"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isConnected ? "animate-pulse" : ""}`}
            style={{
              backgroundColor: isConnected ? "var(--chart-3)" : "var(--chart-5)",
            }}
          />
          {isConnected ? "Live Stream" : "Connecting"}
        </Badge>

        {/* Overview Tab Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onOpenPanel("overview")}
          className={`h-9 w-9 rounded-xl border-border bg-card shadow-xs transition-colors cursor-pointer ${
            activePanel === "overview"
              ? "border-primary text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          style={
            activePanel === "overview"
              ? { backgroundColor: "var(--accent)" }
              : undefined
          }
          title="Overview & Vitals"
        >
          <UserCheck className="w-4 h-4" />
        </Button>

        {/* History Tab Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onOpenPanel("history")}
          className={`h-9 w-9 rounded-xl border-border bg-card shadow-xs transition-colors cursor-pointer ${
            activePanel === "history"
              ? "border-primary text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          style={
            activePanel === "history"
              ? { backgroundColor: "var(--accent)" }
              : undefined
          }
          title="Telemetry History"
        >
          <History className="w-4 h-4" />
        </Button>

        {/* Settings Tab Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => onOpenPanel("settings")}
          className={`h-9 w-9 rounded-xl border-border bg-card shadow-xs transition-colors cursor-pointer ${
            activePanel === "settings"
              ? "border-primary text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          style={
            activePanel === "settings"
              ? { backgroundColor: "var(--accent)" }
              : undefined
          }
          title="System Settings"
        >
          <Sliders className="w-4 h-4" />
        </Button>

        {/* User Avatar Initial Button */}
        {user && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenPanel("overview")}
            className="h-8 w-8 rounded-full font-bold text-xs ml-1 shadow-xs border cursor-pointer"
            style={{
              backgroundColor: "var(--accent)",
              borderColor: "var(--primary-light)",
              color: "var(--primary)",
            }}
          >
            {userInitial}
          </Button>
        )}
      </div>
    </header>
  );
}