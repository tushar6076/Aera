// aera-web/src/pages/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wind, Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email: email.trim(), password });
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Atmospheric Ambient Glow using primary token */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-30" 
        style={{ backgroundColor: "var(--primary)" }}
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
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Sign in to Aera</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Access atmospheric telemetry and personal sensor nodes
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {error && (
            <div className="mb-6 flex items-center gap-2 p-3 text-xs rounded-xl border border-destructive/30 bg-destructive/10 text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 pl-10 h-10 text-sm focus-visible:ring-ring"
                />
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <Link
                  to="/forgot"
                  className="text-xs text-primary hover:underline font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 pl-10 pr-10 h-10 text-sm focus-visible:ring-ring"
                />
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold h-11 gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.99]"
            >
              <span>{loading ? "Authenticating..." : "Enter Workspace"}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Need to initialize an account?{" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}