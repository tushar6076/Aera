// aera-web/src/pages/register/Step2.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";

export default function Step2({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
  onBack,
  loading,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-left">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Create Password
        </label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
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

      <div className="text-left">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Confirm Password
        </label>
        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 pl-10 pr-10 h-10 text-sm focus-visible:ring-ring"
          />
          <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3 pointer-events-none" />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            tabIndex={-1}
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="h-11 px-4 border-border bg-card hover:bg-muted text-foreground text-xs font-semibold gap-1.5 cursor-pointer shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold h-11 gap-2 shadow-sm cursor-pointer transition-all active:scale-[0.99]"
        >
          <span>{loading ? "Creating..." : "Complete Setup"}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="mt-6 pt-6 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          Already have an active profile?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}