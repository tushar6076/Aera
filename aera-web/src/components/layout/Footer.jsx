import React from "react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border/80 bg-card/60 py-6 px-4 sm:px-8 text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} Aera Environmental Labs. All rights reserved.</p>
        <div className="flex items-center gap-4 text-muted-foreground">
          <span>NAQI Standard (CPCB)</span>
          <span>•</span>
          <span>FastAPI Engine</span>
          <span>•</span>
          <a
            href="https://aera-cloud.hacksmiths.dev/docs"
            target="_blank"
            rel="noreferrer"
            className="hover:text-sky-600 transition-colors"
          >
            API Documentation
          </a>
        </div>
      </div>
    </footer>
  );
}