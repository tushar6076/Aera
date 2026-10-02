// aera-web/src/components/layout/panel/PanelLayout.jsx
import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import OverviewPanel from "./OverviewPanel";
import HistoryPanel from "./HistoryPanel";
import SettingsPanel from "./SettingsPanel";
import { X, UserCheck, History as HistoryIcon, Sliders } from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: UserCheck },
  { id: "history", label: "History", icon: HistoryIcon },
  { id: "settings", label: "Settings", icon: Sliders },
];

export default function PanelLayout({
  isOpen,
  onClose,
  activeTab = "overview",
  onTabChange,
  deviceContext,
}) {
  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
        isOpen ? "pointer-events-auto visible" : "pointer-events-none invisible"
      }`}
    >
      {/* 1. Backdrop Overlay using semantic foreground blur */}
      <div
        onClick={onClose}
        className={`fixed inset-0 transition-opacity duration-300 ease-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        style={{
          backgroundColor: "color-mix(in srgb, var(--foreground) 45%, transparent)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* 2. Slide-over Drawer Shell with Subtle Translucency */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <aside
          role="dialog"
          aria-modal="true"
          className={`w-screen max-w-md border-l border-border text-foreground shadow-2xl transition-transform duration-300 ease-out flex flex-col justify-between overflow-hidden ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
          style={{
            backgroundColor: "color-mix(in srgb, var(--card) 95%, transparent)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <Tabs
            value={activeTab}
            onValueChange={onTabChange}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Top Navigation Strip */}
            <div
              className="p-4 border-b border-border flex items-center justify-between gap-3 shrink-0"
              style={{
                backgroundColor: "color-mix(in srgb, var(--card-muted) 85%, transparent)",
              }}
            >
              <TabsList className="grid w-full grid-cols-3 bg-muted/80 p-1 rounded-2xl h-10 border border-border">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={`relative text-xs font-semibold flex items-center justify-center gap-1.5 transition-all rounded-xl h-8 cursor-pointer ${
                        isSelected
                          ? "bg-card text-primary shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={
                        isSelected
                          ? { backgroundColor: "var(--card)" }
                          : undefined
                      }
                    >
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isSelected ? "text-primary stroke-[2.5]" : ""
                        }`}
                      />
                      <span>{tab.label}</span>
                      {isSelected && (
                        <span
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                          style={{ backgroundColor: "var(--primary)" }}
                        />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl shrink-0 cursor-pointer"
                title="Close Panel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Scrollable Sub-Panel Viewport */}
            <div className="flex-1 overflow-y-auto p-6">
              <TabsContent value="overview" className="m-0 mt-0">
                <OverviewPanel
                  deviceContext={deviceContext}
                  onSwitchTab={onTabChange}
                />
              </TabsContent>
              <TabsContent value="history" className="m-0 mt-0">
                <HistoryPanel deviceContext={deviceContext} />
              </TabsContent>
              <TabsContent value="settings" className="m-0 mt-0">
                <SettingsPanel deviceContext={deviceContext} onClose={onClose} />
              </TabsContent>
            </div>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}