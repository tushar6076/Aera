import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/services/user";
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
      setStatusMsg("Profile details saved successfully.");
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
      await userService.releaseDevice(deviceId);
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
        <p className="text-xs text-muted-foreground">Account identity & alert parameters</p>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleProfileSave} className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Profile Identity
        </span>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Display Name
          </label>
          <div className="relative">
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-muted/30 border-border text-foreground pl-10 text-sm focus-visible:ring-sky-500"
            />
            <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Account Email
          </label>
          <div className="relative">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-muted/30 border-border text-foreground pl-10 text-sm focus-visible:ring-sky-500"
            />
            <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold gap-2 shadow-2xs cursor-pointer transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? "Saving..." : "Save Preferences"}</span>
        </Button>
      </form>

      <div className="pt-4 border-t border-border/80 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
          Manage Device Linkages
        </span>

        {devices.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active nodes to manage.</p>
        ) : (
          devices.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between p-3 rounded-2xl border border-border bg-card shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-muted-foreground" />
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
                className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                title="Unlink Device"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t border-border/80">
        <Button
          variant="outline"
          onClick={() => {
            onClose();
            logout();
          }}
          className="w-full border-rose-200 text-rose-700 bg-rose-50/50 hover:bg-rose-50 hover:text-rose-800 text-xs font-semibold gap-2 cursor-pointer transition-colors"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600" />
          <span>Sign Out of Aera</span>
        </Button>
      </div>
    </div>
  );
}