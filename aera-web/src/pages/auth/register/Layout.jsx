// aera-web/src/pages/register/RegisterLayout.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { authService } from "@/services/auth";
import Step1 from "./Step1";
import Step2 from "./Step2";
import { Wind, AlertCircle, Check } from "lucide-react";

export default function RegisterLayout() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    setError("");
    if (!email.trim()) {
      setError("Please provide a valid email address.");
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setError("");
    setStep(1);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.register({
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined,
      });

      localStorage.setItem("aera_token", data.access_token);
      setUser(data.user);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Registration failed. Verify details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Ambient Glow using primary token */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-25"
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
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight">Create Workspace</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Join the Aera environmental telemetry network
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          {/* Progress Tracker */}
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step === 1
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "border"
                }`}
                style={
                  step > 1
                    ? {
                        backgroundColor: "var(--accent)",
                        borderColor: "var(--primary-light)",
                        color: "var(--primary)",
                      }
                    : {}
                }
              >
                {step > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
              </div>
              <span className={`text-xs font-semibold text-left ${step === 1 ? "text-foreground" : "text-muted-foreground"}`}>
                Identity
              </span>
            </div>

            <div className="h-0.5 flex-1 mx-4 bg-muted">
              <div
                className={`h-full bg-primary transition-all duration-300 ${
                  step === 2 ? "w-full" : "w-0"
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  step === 2
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
              <span className={`text-xs font-semibold text-left ${step === 2 ? "text-foreground" : "text-muted-foreground"}`}>
                Security
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 p-3 text-xs rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-destructive" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <Step1
              fullName={fullName}
              setFullName={setFullName}
              email={email}
              setEmail={setEmail}
              onNext={handleNext}
            />
          ) : (
            <Step2
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              onSubmit={handleRegisterSubmit}
              onBack={handleBack}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}