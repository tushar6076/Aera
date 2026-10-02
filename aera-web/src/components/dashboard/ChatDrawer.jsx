// aera-web/src/components/dashboard/ChatDrawer.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChat } from "@/hooks/useChat";
import {
  Sparkles,
  Send,
  Bot,
  User,
  Cpu,
  Trash2,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function ChatDrawer({
  open,
  onOpenChange,
  activeDeviceId = null,
  activeDeviceName = "Ambient Grid",
  currentReading = null,
}) {
  const { messages, loading, error, sendMessage, clearChat } = useChat(activeDeviceId);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    const text = inputText;
    setInputText("");
    await sendMessage(text);
  };

  const handleSuggestionClick = (text) => {
    sendMessage(text);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-card text-foreground border-l border-border h-full shadow-2xl"
      >
        {/* Header */}
        <SheetHeader className="p-5 border-b border-border bg-card-muted">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="p-2.5 rounded-2xl border"
                style={{
                  backgroundColor: "var(--accent)",
                  borderColor: "var(--primary-light)",
                  color: "var(--primary)",
                }}
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-foreground">
                  Aera Atmospheric AI
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Cpu className="w-3.5 h-3.5 text-primary" />
                  <span>Target: <strong className="text-foreground">{activeDeviceName}</strong></span>
                </SheetDescription>
              </div>
            </div>

            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
                title="Clear Conversation"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Real-Time Telemetry Context Banner */}
          {currentReading && (
            <div className="mt-3.5 flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-card border border-border text-xs shadow-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <span 
                  className="w-2 h-2 rounded-full animate-pulse" 
                  style={{ backgroundColor: "var(--chart-3)" }} 
                />
                Live Sensor Sync
              </span>
              <span className="font-mono font-bold text-foreground">
                AQI {currentReading.aqi ?? "--"} · PM2.5 {currentReading.pm2_5 ?? "--"} µg/m³
              </span>
            </div>
          )}
        </SheetHeader>

        {/* Message Thread Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-card">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center px-4 space-y-4">
              <div 
                className="p-4 rounded-3xl border shadow-xs"
                style={{
                  backgroundColor: "var(--accent)",
                  borderColor: "var(--primary-light)",
                  color: "var(--primary)",
                }}
              >
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">
                  Atmospheric Diagnostic Assistant
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                  Ask about current particulate spikes, microclimate trends, or optimal ventilation routines.
                </p>
              </div>

              {/* Suggestions */}
              <div className="w-full space-y-2 pt-2">
                {[
                  "Is the air clean enough for a workout right now?",
                  "Why is the PM2.5 reading elevated?",
                  "When should I open windows for cross-ventilation?",
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-3.5 rounded-2xl bg-muted/40 hover:bg-muted border border-border text-xs text-foreground font-medium transition-all shadow-xs flex items-center justify-between group cursor-pointer"
                  >
                    <span>"{suggestion}"</span>
                    <Zap className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div 
                      className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-xs"
                      style={{
                        backgroundColor: "var(--accent)",
                        borderColor: "var(--primary-light)",
                        color: "var(--primary)",
                      }}
                    >
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-2xl max-w-[85%] text-xs leading-relaxed space-y-1.5 shadow-xs ${
                      isUser
                        ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                        : msg.isError
                        ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-xs"
                        : "bg-muted/60 text-foreground border border-border rounded-tl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {!isUser && msg.telemetryInjected && (
                      <div className="flex items-center gap-1.5 text-[10px] text-primary font-bold pt-1.5 border-t border-border mt-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        <span>Live telemetry context evaluated</span>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-muted text-muted-foreground border border-border flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {loading && (
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-xs"
                style={{
                  backgroundColor: "var(--accent)",
                  borderColor: "var(--primary-light)",
                  color: "var(--primary)",
                }}
              >
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="p-3.5 rounded-2xl bg-muted/60 border border-border text-xs text-foreground flex items-center gap-2.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px] font-semibold text-muted-foreground">
                  Synthesizing atmospheric telemetry...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Dock */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-border bg-card-muted flex items-center gap-2"
        >
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask Aera about your air quality..."
            disabled={loading}
            className="rounded-2xl border-border bg-card text-foreground placeholder:text-muted-foreground/60 text-xs py-5 focus-visible:ring-ring shadow-xs"
          />
          <Button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground h-11 w-11 shrink-0 p-0 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}