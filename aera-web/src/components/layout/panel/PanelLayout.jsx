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
      {/* Dimmed backdrop fade */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/25 backdrop-blur-xs transition-opacity duration-300 ease-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Slide-over Drawer Container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-8 sm:pl-12">
        <aside
          className={`w-screen max-w-md border-l border-border bg-card/95 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-out flex flex-col justify-between ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <Tabs
            value={activeTab}
            onValueChange={onTabChange}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Top Bar: Tabs & Close Button */}
            <div className="p-4 border-b border-border/80 flex items-center justify-between gap-3 bg-muted/30">
              <TabsList className="grid w-full grid-cols-3 bg-muted/60 border border-border/70 p-1 rounded-xl">
                {TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="text-xs data-[state=active]:bg-card data-[state=active]:text-sky-600 data-[state=active]:shadow-2xs text-muted-foreground font-medium flex items-center gap-1.5 transition-all rounded-lg"
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg shrink-0 cursor-pointer"
                title="Close Panel"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Scrollable Sub-Panel Content */}
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