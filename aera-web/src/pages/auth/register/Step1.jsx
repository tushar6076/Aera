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
            className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/60 pl-10 h-10 text-sm focus-visible:ring-sky-500"
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
            className="bg-muted/30 border-border text-foreground placeholder:text-muted-foreground/60 pl-10 h-10 text-sm focus-visible:ring-sky-500"
          />
          <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3 pointer-events-none" />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold h-11 gap-2 shadow-md shadow-sky-600/20 mt-2 cursor-pointer transition-all"
      >
        <span>Continue to Security</span>
        <ArrowRight className="w-4 h-4" />
      </Button>

      <div className="mt-6 pt-6 border-t border-border/80 text-center">
        <p className="text-xs text-muted-foreground">
          Already have an active profile?{" "}
          <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700">
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}