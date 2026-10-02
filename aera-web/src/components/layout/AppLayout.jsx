// aera-web/src/components/layout/AppLayout.jsx
import React, { useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import PanelLayout from "./panel/PanelLayout";

export default function AppLayout({ children, isConnected = true, deviceContext }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleOpenPanel = (tabKey) => {
    setActiveTab(tabKey);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col text-foreground antialiased selection:bg-primary/15 selection:text-primary">
      <Navbar
        isConnected={isConnected}
        onOpenPanel={handleOpenPanel}
        activePanel={panelOpen ? activeTab : null}
      />

      <div className="flex-1 flex flex-col justify-between overflow-x-hidden min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
        <Footer />
      </div>

      <PanelLayout
        isOpen={panelOpen}
        onClose={handleClosePanel}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        deviceContext={deviceContext}
      />
    </div>
  );
}