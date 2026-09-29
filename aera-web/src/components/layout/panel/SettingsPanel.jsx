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
        <h3 className="text-sm font-bold text-white">System Settings</h3>
        <p className="text-xs text-slate-400">Account identity & alert parameters</p>
      </div>

      {statusMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 rounded-xl">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleProfileSave} className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Profile Identity
        </span>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Display Name
          </label>
          <div className="relative">
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-slate-950 border-slate-800 pl-10 text-sm"
            />
            <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Account Email
          </label>
          <div className="relative">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-950 border-slate-800 pl-10 text-sm"
            />
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold gap-2 shadow-md cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? "Saving..." : "Save Preferences"}</span>
        </Button>
      </form>

      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Manage Device Linkages
        </span>

        {devices.length === 0 ? (
          <p className="text-xs text-slate-500">No active nodes to manage.</p>
        ) : (
          devices.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between p-3 rounded-2xl border border-slate-800 bg-slate-950/60"
            >
              <div className="flex items-center gap-2.5">
                <Cpu className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-white">{d.name || d.id}</p>
                  <p className="text-[10px] text-slate-500 font-mono">ID: {d.id}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRelease(d.id)}
                disabled={releasingId === d.id}
                className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg cursor-pointer"
                title="Unlink Device"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="pt-4 border-t border-slate-800/80">
        <Button
          variant="outline"
          onClick={() => {
            onClose();
            logout();
          }}
          className="w-full border-rose-900/40 text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 text-xs font-semibold gap-2 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out of Aera</span>
        </Button>
      </div>
    </div>
  );
}