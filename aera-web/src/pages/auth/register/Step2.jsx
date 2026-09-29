import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ArrowRight, ArrowLeft } from "lucide-react";

export default function Step2({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
  onBack,
  loading,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-left">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
          Create Password
        </label>
        <div className="relative">
          <Input
            type="password"
            required
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="bg-slate-950/70 border-slate-800 pl-10 h-10 text-sm text-white placeholder:text-slate-500"
          />
          <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
        </div>
      </div>

      <div className="text-left">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
          Confirm Password
        </label>
        <div className="relative">
          <Input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="bg-slate-950/70 border-slate-800 pl-10 h-10 text-sm text-white placeholder:text-slate-500"
          />
          <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="h-11 px-4 border-slate-800 bg-slate-950/70 hover:bg-slate-800 text-slate-300 text-xs font-semibold gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </Button>

        <Button
          type="submit"
          disabled={loading}
          className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold h-11 gap-2 shadow-lg shadow-sky-600/20 cursor-pointer"
        >
          <span>{loading ? "Creating..." : "Complete Setup"}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
        <p className="text-xs text-slate-400">
          Already have an active profile?{" "}
          <Link to="/login" className="font-semibold text-sky-400 hover:text-sky-300">
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}