import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Mountain, KeyRound, ArrowLeft, CheckCircle2, X, Sparkles, Info } from "lucide-react";
import { api, setSession } from "@/lib/api-client";

const searchSchema = z.object({
  role: z.enum(["hiker", "driver"]).optional(),
  banned: z.boolean().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Limpopo Hike Connect" },
      { name: "description", content: "Sign in or create a hiker or driver account." },
    ],
  }),
  component: AuthPage,
});

type Role = "hiker" | "driver";

function AuthPage() {
  const { role: initialRole, banned } = Route.useSearch();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [role, setRole] = useState<Role>(initialRole ?? "hiker");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [googleDialogOpen, setGoogleDialogOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googleRole, setGoogleRole] = useState<Role>(initialRole ?? "hiker");
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const [verificationRequired, setVerificationRequired] = useState(false);
  const [pendingUserId, setPendingUserId] = useState("");
  const [pendingToken, setPendingToken] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [pendingRedirect, setPendingRedirect] = useState("");

  // Forgot password state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPin, setForgotPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotStep, setForgotStep] = useState<"email" | "pin">("email");
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [devPinHint, setDevPinHint] = useState("");

  const resetForgotDialog = () => {
    setForgotModalOpen(false);
    setForgotEmail("");
    setForgotPin("");
    setNewPassword("");
    setConfirmNewPassword("");
    setForgotStep("email");
    setForgotError("");
    setForgotSuccess("");
    setDevPinHint("");
  };

  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your account email.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", {
        email: forgotEmail.trim().toLowerCase(),
      });
      if (res.data?.pin) {
        setDevPinHint(res.data.pin);
        setForgotPin(res.data.pin);
      }
      setForgotStep("pin");
    } catch (err: any) {
      setForgotError(err.response?.data?.error || "Failed to find account. Please check the email address.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (!forgotPin.trim()) {
      setForgotError("Please enter the 6-digit reset code.");
      return;
    }
    if (newPassword.length < 6) {
      setForgotError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError("Passwords do not match.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email: forgotEmail.trim().toLowerCase(),
        pin: forgotPin.trim(),
        newPassword,
      });
      setForgotSuccess(res.data?.message || "Password updated successfully!");
      setEmail(forgotEmail.trim().toLowerCase());
      setPassword(newPassword);
      setMode("signin");
      setTimeout(() => {
        resetForgotDialog();
      }, 2000);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || "Failed to reset password. Please check your reset code.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response?.credential) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.post("/auth/google", {
        credential: response.credential,
        role: role === "driver" ? "driver" : "hiker",
      });
      setSession(res.data.token, res.data.userId);
      navigate({ to: "/feed" });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initGsi = () => {
      const g = (window as any).google;
      if (g?.accounts?.id && googleClientId) {
        try {
          g.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          const btnEl = document.getElementById("googleOfficialBtn");
          if (btnEl) {
            btnEl.innerHTML = "";
            g.accounts.id.renderButton(btnEl, {
              theme: "outline",
              size: "large",
              width: "100%",
              text: "continue_with",
              shape: "pill",
            });
          }
        } catch (err) {
          console.warn("Google GSI initialization notice:", err);
        }
      }
    };

    if ((window as any).google?.accounts?.id) {
      initGsi();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.head.appendChild(script);
    }
  }, [googleClientId, role]);

  const handleGoogleButtonClick = () => {
    setErrorMsg("");
    const g = (window as any).google;
    if (googleClientId && g?.accounts?.id) {
      try {
        g.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setGoogleDialogOpen(true);
          }
        });
        return;
      } catch (e) {
        console.warn("GSI prompt notice:", e);
      }
    }
    setGoogleDialogOpen(true);
  };

  const resetGoogleDialog = () => {
    setGoogleDialogOpen(false);
    setGoogleEmail("");
    setGoogleName("");
    setGoogleLoading(false);
  };

  const handleGoogleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setErrorMsg("Please provide your Google email address.");
      return;
    }
    setGoogleLoading(true);
    setErrorMsg("");
    try {
      const res = await api.post("/auth/google", {
        googleEmail: googleEmail.trim().toLowerCase(),
        name: googleName.trim() || googleEmail.split("@")[0],
        role: googleRole,
      });

      setSession(res.data.token, res.data.userId);
      resetGoogleDialog();
      navigate({ to: "/feed" });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Google Sign-In failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleQuickGoogleSignIn = async (presetEmail: string, presetName: string, presetRole: Role) => {
    setGoogleEmail(presetEmail);
    setGoogleName(presetName);
    setGoogleRole(presetRole);
    setGoogleLoading(true);
    setErrorMsg("");
    try {
      const res = await api.post("/auth/google", {
        googleEmail: presetEmail.trim().toLowerCase(),
        name: presetName,
        role: presetRole,
      });
      setSession(res.data.token, res.data.userId);
      resetGoogleDialog();
      navigate({ to: "/feed" });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Google Sign-In failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!email || !password) { setErrorMsg("Email and password are required."); return; }
        const res = await api.post("/auth/register", {
          name: name.trim() || "New traveler",
          email: email.trim().toLowerCase(),
          password,
          role,
        });
        setSession(res.data.token, res.data.userId);
        navigate({ to: role === "driver" ? "/onboarding/driver" : "/onboarding/hiker" });
      } else {
        const res = await api.post("/auth/login", {
          email: email.trim().toLowerCase(),
          password,
        });
        setSession(res.data.token, res.data.userId);
        navigate({ to: "/feed" });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || "Something went wrong. Please try again.";
      if (msg.toLowerCase().includes("banned")) {
        setErrorMsg("Your account has been suspended due to community safety policy violations.");
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!pinInput) { setErrorMsg("Please enter the verification PIN."); return; }
    setLoading(true);
    try {
      // Temporarily set the pending token so the verifyPin endpoint can be called as authenticated
      localStorage.setItem("hitch_token", pendingToken);
      await api.post("/auth/verify-pin", { pin: pinInput });
      navigate({ to: pendingRedirect || "/feed" });
    } catch (err: any) {
      localStorage.removeItem("hitch_token");
      setErrorMsg(err.response?.data?.error || "Invalid PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (verificationRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 inline-flex items-center gap-2">
            <Mountain className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold">HikeConnect</span>
          </Link>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-2">Verify your account</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Please enter the 6-digit verification PIN sent to your phone or email.
            </p>
            {errorMsg && (
              <div className="mb-4 rounded-xl bg-destructive/15 p-3.5 text-xs text-destructive font-medium border border-destructive/25 text-center">
                ⚠️ {errorMsg}
              </div>
            )}
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Verification PIN</label>
                <input
                  type="text"
                  required
                  placeholder="123456"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full rounded-xl border bg-secondary/30 px-4 py-3 text-sm tracking-widest text-center focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => {
                setVerificationRequired(false);
                setPendingUserId("");
                setPendingToken("");
                setPinInput("");
                setErrorMsg("");
              }}
              className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-destructive transition cursor-pointer"
            >
              Cancel & start over
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-2">
          <Mountain className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-bold">HikeConnect</span>
        </Link>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          {banned && (
            <div className="mb-4 rounded-xl bg-destructive/15 p-3.5 text-xs text-destructive font-medium border border-destructive/25 text-center animate-pulse">
              ❌ Your account has been suspended due to 10 or more community safety flags.
            </div>
          )}
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-destructive/15 p-3.5 text-xs text-destructive font-medium border border-destructive/25 text-center">
              ⚠️ {errorMsg}
            </div>
          )}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-muted p-1 text-sm font-medium">
            <button
              onClick={() => setMode("signup")}
              className={`rounded-full py-2 transition ${mode === "signup" ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}
            >
              Create account
            </button>
            <button
              onClick={() => setMode("signin")}
              className={`rounded-full py-2 transition ${mode === "signin" ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}
            >
              Sign in
            </button>
          </div>

          <p className="mb-3 text-sm font-medium">I am a</p>
          <div className="mb-5 grid grid-cols-2 gap-3">
            <RoleCard active={role === "hiker"} onClick={() => setRole("hiker")} emoji="🧳" label="Hiker" sub="I need rides" />
            <RoleCard active={role === "driver"} onClick={() => setRole("driver")} emoji="🚐" label="Driver" sub="I offer rides" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "signup" && (
              <Field label="Full name" value={name} onChange={setName} placeholder="Naledi Sithole" />
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
            {mode === "signin" && (
              <div className="flex justify-end -mt-1 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg("");
                    setForgotEmail(email || "");
                    setForgotStep("email");
                    setForgotError("");
                    setForgotSuccess("");
                    setForgotModalOpen(true);
                  }}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink mx-3 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Or</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            {googleClientId && (
              <div id="googleOfficialBtn" className="w-full flex justify-center mb-2 min-h-[40px]" />
            )}

            <button
              type="button"
              onClick={handleGoogleButtonClick}
              className="w-full flex items-center justify-center gap-2.5 rounded-full border border-border bg-card py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary cursor-pointer shadow-sm"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.48-1.12 2.73-2.38 3.58v2.98h3.84c2.24-2.06 3.68-5.1 3.68-8.39z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.84-2.98c-1.08.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01H1.32v3.08c1.98 3.93 6.02 6.66 10.68 6.66z" />
                <path fill="#FBBC05" d="M5.24 14.26c-.25-.72-.39-1.5-.39-2.3s.14-1.58.39-2.3V6.58H1.32c-.84 1.68-1.32 3.56-1.32 5.5s.48 3.82 1.32 5.5l3.92-3.08z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.93 1.19 15.24 0 12 0 7.34 0 3.3 2.73 1.32 6.66l3.92 3.08c.95-2.88 3.61-5.01 6.76-5.01z" />
              </svg>
              Continue with Google
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Created by{" "}
          <a href="http://dac-technologies.co.za/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            Dac-Technology
          </a>
        </p>
      </div>

      {/* Google Authentication Dialog */}
      {googleDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/80 border">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.48-1.12 2.73-2.38 3.58v2.98h3.84c2.24-2.06 3.68-5.1 3.68-8.39z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.84-2.98c-1.08.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01H1.32v3.08c1.98 3.93 6.02 6.66 10.68 6.66z" />
                    <path fill="#FBBC05" d="M5.24 14.26c-.25-.72-.39-1.5-.39-2.3s.14-1.58.39-2.3V6.58H1.32c-.84 1.68-1.32 3.56-1.32 5.5s.48 3.82 1.32 5.5l3.92-3.08z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.93 1.19 15.24 0 12 0 7.34 0 3.3 2.73 1.32 6.66l3.92 3.08c.95-2.88 3.61-5.01 6.76-5.01z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-foreground">
                    Sign In with Google
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Safe, password-free login via Limpopo Hitch Connect
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetGoogleDialog}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Role selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGoogleRole("hiker")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer ${
                    googleRole === "hiker"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40 text-muted-foreground"
                  }`}
                >
                  <span>🧳</span> Rider / Passenger
                </button>
                <button
                  type="button"
                  onClick={() => setGoogleRole("driver")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer ${
                    googleRole === "driver"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40 text-muted-foreground"
                  }`}
                >
                  <span>🚐</span> Driver
                </button>
              </div>
            </div>

            <form onSubmit={handleGoogleDirectSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Google Account Email
                </label>
                <input
                  type="email"
                  required
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="e.g. thabo@gmail.com"
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">
                  Your Full Name <span className="font-normal text-muted-foreground/80">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Thabo Mokoena"
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary transition"
                />
              </div>

              {/* Quick Fill One-Click Demo accounts */}
              <div className="rounded-xl border bg-secondary/30 p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>One-Click Quick Sign In</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickGoogleSignIn("thabo.mokoena@gmail.com", "Thabo Mokoena", "hiker")}
                    className="flex flex-col items-start rounded-lg border bg-card p-2 text-left hover:border-primary/50 transition cursor-pointer"
                  >
                    <span className="text-xs font-semibold">🧳 Thabo M.</span>
                    <span className="text-[10px] text-muted-foreground truncate w-full">thabo.mokoena@gmail.com</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickGoogleSignIn("kagiso.driver@gmail.com", "Kagiso Ndlovu", "driver")}
                    className="flex flex-col items-start rounded-lg border bg-card p-2 text-left hover:border-primary/50 transition cursor-pointer"
                  >
                    <span className="text-xs font-semibold">🚐 Kagiso N.</span>
                    <span className="text-[10px] text-muted-foreground truncate w-full">kagiso.driver@gmail.com</span>
                  </button>
                </div>
              </div>

              {/* Production Note */}
              <div className="flex items-start gap-2 rounded-xl bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <span>
                  {googleClientId
                    ? "Official Google Identity Services is linked to your Google Client ID."
                    : "For automatic Google popups in production, set VITE_GOOGLE_CLIENT_ID in your .env"}
                </span>
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={resetGoogleDialog}
                  className="flex-1 rounded-full bg-muted py-2.5 text-xs font-semibold cursor-pointer hover:bg-muted/80 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={googleLoading}
                  className="flex-1 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 cursor-pointer disabled:opacity-50 transition shadow-sm"
                >
                  {googleLoading ? "Signing in..." : "Continue with Google"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl border text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <KeyRound className="h-4 w-4" />
                </div>
                <h2 className="font-display text-lg font-bold">Reset Password</h2>
              </div>
              <button
                type="button"
                onClick={resetForgotDialog}
                className="text-muted-foreground hover:text-foreground p-1 rounded transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4 py-3 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-500 mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-foreground">Password Reset Successful!</h3>
                  <p className="text-xs text-muted-foreground">{forgotSuccess}</p>
                </div>
                <p className="text-[11px] text-primary animate-pulse">Switching to sign in...</p>
              </div>
            ) : (
              <>
                {forgotError && (
                  <div className="mb-4 rounded-xl bg-destructive/15 p-3 text-xs text-destructive font-medium border border-destructive/25 text-center">
                    ⚠️ {forgotError}
                  </div>
                )}

                {forgotStep === "email" ? (
                  <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Enter the email address registered with your account. We will generate a verification reset code.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Account Email</label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={resetForgotDialog}
                        className="flex-1 rounded-full bg-muted py-2.5 text-xs font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="flex-1 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 cursor-pointer disabled:opacity-50"
                      >
                        {forgotLoading ? "Checking..." : "Continue"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => { setForgotStep("email"); setForgotError(""); }}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <ArrowLeft className="h-3 w-3" /> Change email
                      </button>
                      <span className="text-[11px] text-muted-foreground font-mono">{forgotEmail}</span>
                    </div>

                    {devPinHint && (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground space-y-1">
                        <div className="font-semibold text-primary flex items-center gap-1">
                          <span>🔑 Verification Reset Code</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Code generated for your account: <strong className="text-primary font-mono text-xs">{devPinHint}</strong> (pre-filled below)
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Reset Code (PIN)</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={forgotPin}
                        onChange={(e) => setForgotPin(e.target.value)}
                        placeholder="e.g. 123456"
                        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none tracking-widest font-mono focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">New Password</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={resetForgotDialog}
                        className="flex-1 rounded-full bg-muted py-2.5 text-xs font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="flex-1 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 cursor-pointer disabled:opacity-50"
                      >
                        {forgotLoading ? "Updating..." : "Save New Password"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RoleCard({ active, onClick, emoji, label, sub }: { active: boolean; onClick: () => void; emoji: string; label: string; sub: string }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border-2 p-4 text-left transition ${active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
      <div className="text-2xl">{emoji}</div>
      <div className="mt-2 font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </button>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
    </label>
  );
}
