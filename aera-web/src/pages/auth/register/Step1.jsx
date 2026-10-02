// aera-web/src/pages/register/Step1.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, ArrowRight } from "lucide-react";

export default function Step1({ fullName, setFullName, email, setEmail, onNext }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-left">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Full Name
        </label>
        <div className="relative">
          <Input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Alex Rivera"
            className="bg-muted/40 border-border text-foreground placeholder:text-muted-foreground/60 pl-10 h-10 text-sm focus-visible:ring-ring"
          />
          <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3 pointer-events-none" />
        </div>
      </div>

      <div className="text-left">
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

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold h-11 gap-2 shadow-sm mt-2 cursor-pointer transition-all active:scale-[0.99]"
      >
        <span>Continue to Security</span>
        <ArrowRight className="w-4 h-4" />
      </Button>

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