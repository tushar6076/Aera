import React from "react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-900 bg-slate-950/40 py-6 px-4 sm:px-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} Aera Environmental Labs. All rights reserved.</p>
        <div className="flex items-center gap-4 text-slate-400">
          <span>NAQI Standard (CPCB)</span>
          <span>•</span>
          <span>FastAPI Engine</span>
          <span>•</span>
          <a
            href="https://aera-cloud.hacksmiths.dev/docs"
            target="_blank"
            rel="noreferrer"
            className="hover:text-sky-400 transition-colors"
          >
            API Documentation
          </a>
        </div>
      </div>
    </footer>
  );
}