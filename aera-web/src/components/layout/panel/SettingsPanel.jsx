// aera-web/src/components/settings/SettingsPanel.jsx
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDevice } from "@/hooks/useDevice";
import { userService } from "@/services/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  LogOut,
  Cpu,
  UserX,
  AlertTriangle,
} from "lucide-react";

export default function SettingsPanel({ deviceContext, onClose }) {
  const { user, setUser, logout } = useAuth();
  
  // Use global context directly, or fall back to deviceContext prop if provided
  const globalDevice = useDevice();
  const activeDeviceContext = deviceContext || globalDevice;
  const { 
    devices = [], 
    selectedDevice, 
    setSelectedDevice, 
    release, 
    refreshDevices 
  } = activeDeviceContext;

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saving, setSaving] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [releasingId, setReleasingId] = useState(null);

  // Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleteDialogError, setDeleteDialogError] = useState("");

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
      if (release) {
        await release(deviceId);
      }
      if (selectedDevice?.id === deviceId && setSelectedDevice) {
        setSelectedDevice(null);
      }
      if (refreshDevices) {
        await refreshDevices();
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to unlink device.");
    } finally {
      setReleasingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (confirmInput.trim() !== "DELETE") {
      setDeleteDialogError('Please type "DELETE" exactly to confirm.');
      return;
    }

    setDeletingAccount(true);
    setDeleteDialogError("");
    try {
      await userService.deleteAccount();
      setDeleteDialogOpen(false);
      onClose();
      logout();
    } catch (err) {
      setDeleteDialogError(
        err.response?.data?.detail || "Failed to delete account. Please try again."
      );
    } finally {
      setDeletingAccount(false);
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
          <p className="text-xs text-muted-foreground italic">
            No claimed hardware stations associated with this account.
          </p>
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

      {/* Danger Zone: Sign Out & Account Deletion */}
      <div className="pt-4 border-t border-border space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
          Session & Account Actions
        </span>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onClose();
            logout();
          }}
          className="w-full border-border hover:bg-muted text-foreground text-xs font-semibold gap-2 rounded-xl h-10 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Sign Out of Aera</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setConfirmInput("");
            setDeleteDialogError("");
            setDeleteDialogOpen(true);
          }}
          className="w-full border-destructive/30 text-destructive bg-destructive/10 hover:bg-destructive/20 text-xs font-semibold gap-2 rounded-xl h-10 transition-colors cursor-pointer"
        >
          <UserX className="w-3.5 h-3.5 text-destructive" />
          <span>Delete Account Permanently</span>
        </Button>
      </div>

      {/* Confirmation Dialog for Permanent Account Deletion */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-border bg-card text-foreground p-6 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Permanently Delete Account
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              Deleting your account will permanently purge your profile, remove all session keys,
              and automatically release all paired Aera Station nodes back to unclaimed status.
            </p>
            <p className="font-medium text-foreground">
              To proceed, please type <span className="font-mono font-bold text-destructive">DELETE</span> below:
            </p>
            <Input
              type="text"
              placeholder='Type "DELETE" to confirm'
              value={confirmInput}
              onChange={(e) => {
                setConfirmInput(e.target.value);
                setDeleteDialogError("");
              }}
              className="bg-muted/40 border-border font-mono text-xs uppercase rounded-xl"
              autoFocus
            />
            {deleteDialogError && (
              <p className="text-xs text-destructive font-medium">{deleteDialogError}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              disabled={deletingAccount}
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={confirmInput.trim() !== "DELETE" || deletingAccount}
              onClick={handleConfirmDelete}
              className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold h-9 shadow-xs"
            >
              {deletingAccount ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}