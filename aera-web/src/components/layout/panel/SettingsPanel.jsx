// aera-web/src/components/layout/panel/SettingsPanel.jsx
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/user";
import { deviceService } from "@/services/device";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  User,
  Mail,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  LogOut,
  Cpu,
} from "lucide-react";

export default function SettingsPanel({ deviceContext, onClose }) {
  const { user, setUser, logout } = useAuth();
  const { devices = [], refreshDevices } = deviceContext;

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [releasingId, setReleasingId] = useState(null);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setStatusMsg("");
    setErrorMsg("");
    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        full_name: fullName.trim() || undefined,
        email: email.trim(),
      });
      setUser(updated);
      setStatusMsg("Profile preferences saved successfully.");
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleRelease = async (deviceId) => {
    if (!window.confirm(`Unlink hardware node "${deviceId}" from your account?`)) return;
    setReleasingId(deviceId);
    try {
      await deviceService.releaseDevice(deviceId);
      await refreshDevices();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to unlink device.");
    } finally {
      setReleasingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-foreground">System Settings</h3>
        <p className="text-xs text-muted-foreground">Account identity & hardware linkages</p>
      </div>

      {statusMsg && (
        <div 
          className="flex items-center gap-2 p-3 text-xs rounded-2xl shadow-xs border"
          style={{
            backgroundColor: "oklch(0.96 0.05 150)",
            borderColor: "oklch(0.85 0.1 150)",
            color: "var(--chart-3)",
          }}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--chart-3)" }} />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-2xl shadow-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleProfileSave} className="space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
          Profile Identity
        </span>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Display Name
          </label>
          <div className="relative">
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-muted/40 border-border text-foreground pl-10 text-xs rounded-xl focus-visible:ring-ring"
            />
            <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Account Email
          </label>
          <div className="relative">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-muted/40 border-border text-foreground pl-10 text-xs rounded-xl focus-visible:ring-ring"
            />
            <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold gap-2 shadow-xs rounded-xl h-10 transition-colors cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? "Saving..." : "Save Preferences"}</span>
        </Button>
      </form>

      {/* Device Management */}
      <div className="pt-4 border-t border-border space-y-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
          Claimed Hardware Nodes
        </span>

        {devices.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No claimed hardware stations associated with this account.</p>
        ) : (
          devices.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-card shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="p-2 rounded-xl border"
                  style={{
                    backgroundColor: "var(--accent)",
                    borderColor: "var(--primary-light)",
                    color: "var(--primary)",
                  }}
                >
                  <Cpu className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{d.name || d.id}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">ID: {d.id}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRelease(d.id)}
                disabled={releasingId === d.id}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl cursor-pointer"
                title="Unlink Device"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Sign Out */}
      <div className="pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => {
            onClose();
            logout();
          }}
          className="w-full border-destructive/30 text-destructive bg-destructive/10 hover:bg-destructive/20 text-xs font-semibold gap-2 rounded-xl h-10 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-destructive" />
          <span>Sign Out of Aera</span>
        </Button>
      </div>
    </div>
  );
}