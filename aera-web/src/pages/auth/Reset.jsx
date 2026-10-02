// aera-web/src/pages/Reset.jsx
import React, { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wind, Lock, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function Reset() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = searchParams.get("token") || "";
  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!token.trim()) {
      setErrorMsg("A valid reset token is required.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token.trim(), newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail || "Password reset token expired or invalid."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Ambient Glow using chart-2 (indigo telemetry) token */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-25" 
        style={{ backgroundColor: "var(--chart-2)" }}
      />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center space-y-2">
          <div 
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-primary-foreground shadow-md mb-2"
            style={{
              background: "linear-gradient(135deg, var(--chart-1) 0%, var(--chart-2) 100%)",
            }}
          >
            <Wind className="w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Set New Password</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Define a strong password to re-secure your workspace
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {success ? (
            <div className="space-y-4 text-center py-4">
              <div 
                className="p-3 rounded-full w-fit mx-auto border"
                style={{
                  backgroundColor: "var(--accent)",
                  borderColor: "var(--primary-light)",
                  color: "var(--primary)",
                }}
              >
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Password Updated</h3>
              <p className="text-xs text-muted-foreground">
                Credentials updated successfully. Redirecting to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 text-xs rounded-xl border border-destructive/30 bg-destructive/10 text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {!tokenParam && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Security Token
                  </label>
                  <Input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste received token"
                    className="bg-muted/40 border-border text-foreground font-mono text-xs h-10 focus-visible:ring-ring"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 pl-10 h-10 text-sm focus-visible:ring-ring"
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 pl-10 h-10 text-sm focus-visible:ring-ring"
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold h-11 gap-2 shadow-sm mt-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                <span>{loading ? "Saving Changes..." : "Reset Password"}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link to="/login" className="text-xs font-semibold text-primary hover:underline">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}