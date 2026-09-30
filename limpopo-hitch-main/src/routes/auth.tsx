import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { Mountain, KeyRound, ArrowLeft, CheckCircle2, X, Mail } from "lucide-react";
import { api, setSession } from "@/lib/api-client";

const searchSchema = z.object({
  role: z.enum(["hiker", "driver"]).optional(),
  banned: z.boolean().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Hitch Connect" },
      { name: "description", content: "Sign in or create a hiker or driver account on Hitch Connect." },
    ],
  }),
  component: AuthPage,
});

type Role = "hiker" | "driver";

// ─── Google SVG ───────────────────────────────────────────────────────────────
function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.48-1.12 2.73-2.38 3.58v2.98h3.84c2.24-2.06 3.68-5.1 3.68-8.39z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.84-2.98c-1.08.72-2.45 1.16-4.09 1.16-3.15 0-5.81-2.13-6.76-5.01H1.32v3.08c1.98 3.93 6.02 6.66 10.68 6.66z" />
      <path fill="#FBBC05" d="M5.24 14.26c-.25-.72-.39-1.5-.39-2.3s.14-1.58.39-2.3V6.58H1.32c-.84 1.68-1.32 3.56-1.32 5.5s.48 3.82 1.32 5.5l3.92-3.08z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.93 1.19 15.24 0 12 0 7.34 0 3.3 2.73 1.32 6.66l3.92 3.08c.95-2.88 3.61-5.01 6.76-5.01z" />
    </svg>
  );
}

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

  // Google Sign-In dialog state
  const [signInGoogleOpen, setSignInGoogleOpen] = useState(false);
  const [signInGoogleEmail, setSignInGoogleEmail] = useState("");
  const [signInGoogleLoading, setSignInGoogleLoading] = useState(false);

  // Google Sign-Up dialog state
  const [signUpGoogleOpen, setSignUpGoogleOpen] = useState(false);
  const [signUpGoogleEmail, setSignUpGoogleEmail] = useState("");
  const [signUpGoogleName, setSignUpGoogleName] = useState("");
  const [signUpGoogleRole, setSignUpGoogleRole] = useState<Role>(initialRole ?? "hiker");
  const [signUpGoogleLoading, setSignUpGoogleLoading] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // PIN verification state (used for both email and Google registration)
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [pendingUserId, setPendingUserId] = useState("");
  const [pendingToken, setPendingToken] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingRole, setPendingRole] = useState<Role>("hiker");
  const [pinInput, setPinInput] = useState("");
  const [rollbackLoading, setRollbackLoading] = useState(false);

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

  const resetForgotDialog = () => {
    setForgotModalOpen(false);
    setForgotEmail("");
    setForgotPin("");
    setNewPassword("");
    setConfirmNewPassword("");
    setForgotStep("email");
    setForgotError("");
    setForgotSuccess("");
  };

  // ─── Google One-Tap Initialization ────────────────────────────────────────
  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response?.credential) return;
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.post("/auth/google", {
        credential: response.credential,
        role: role === "driver" ? "driver" : "hiker",
        mode,
      });
      if (res.data.requiresVerification) {
        setPendingUserId(res.data.userId);
        setPendingToken(res.data.pendingToken);
        setPendingEmail(email);
        setPendingRole(role);
        setSignUpGoogleOpen(false);
        setVerificationRequired(true);
      } else {
        setSession(res.data.token, res.data.userId);
        navigate({ to: "/feed" });
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Google authentication failed. Please try again.");
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
          const btnId = mode === "signin" ? "googleSignInOfficialBtn" : "googleSignUpOfficialBtn";
          const btnEl = document.getElementById(btnId);
          if (btnEl) {
            btnEl.innerHTML = "";
            g.accounts.id.renderButton(btnEl, {
              theme: "outline",
              size: "large",
              width: "100%",
              text: mode === "signin" ? "signin_with" : "signup_with",
              shape: "pill",
            });
          }
        } catch (err) {
          console.warn("Google GSI init:", err);
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
  }, [googleClientId, role, mode]);

  // ─── Open Google Sign-In dialog ───────────────────────────────────────────
  const handleOpenGoogleSignIn = () => {
    setErrorMsg("");
    const g = (window as any).google;
    if (googleClientId && g?.accounts?.id) {
      try {
        g.accounts.id.prompt((n: any) => {
          if (n.isNotDisplayed() || n.isSkippedMoment()) setSignInGoogleOpen(true);
        });
        return;
      } catch {}
    }
    setSignInGoogleOpen(true);
  };

  // ─── Open Google Register dialog ──────────────────────────────────────────
  const handleOpenGoogleSignUp = () => {
    setErrorMsg("");
    const g = (window as any).google;
    if (googleClientId && g?.accounts?.id) {
      try {
        g.accounts.id.prompt((n: any) => {
          if (n.isNotDisplayed() || n.isSkippedMoment()) {
            setSignUpGoogleRole(role);
            setSignUpGoogleOpen(true);
          }
        });
        return;
      } catch {}
    }
    setSignUpGoogleRole(role);
    setSignUpGoogleOpen(true);
  };

  // ─── Google Sign-In submit ────────────────────────────────────────────────
  const handleSignInGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInGoogleEmail.trim()) { setErrorMsg("Please enter your Google email address."); return; }
    setSignInGoogleLoading(true);
    setErrorMsg("");
    try {
      const res = await api.post("/auth/google", {
        googleEmail: signInGoogleEmail.trim().toLowerCase(),
        mode: "signin",
      });
      setSession(res.data.token, res.data.userId);
      setSignInGoogleOpen(false);
      navigate({ to: "/feed" });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Google Sign-In failed. Please try again.");
    } finally {
      setSignInGoogleLoading(false);
    }
  };

  // ─── Google Register submit ───────────────────────────────────────────────
  const handleSignUpGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpGoogleEmail.trim()) { setErrorMsg("Please enter your Google email address."); return; }
    if (!signUpGoogleName.trim()) { setErrorMsg("Please enter your full name."); return; }
    setSignUpGoogleLoading(true);
    setErrorMsg("");
    try {
      const res = await api.post("/auth/google", {
        googleEmail: signUpGoogleEmail.trim().toLowerCase(),
        name: signUpGoogleName.trim(),
        role: signUpGoogleRole,
        mode: "signup",
      });
      if (res.data.requiresVerification) {
        setPendingUserId(res.data.userId);
        setPendingToken(res.data.pendingToken);
        setPendingEmail(signUpGoogleEmail.trim().toLowerCase());
        setPendingRole(signUpGoogleRole);
        setSignUpGoogleOpen(false);
        setVerificationRequired(true);
      } else {
        setSession(res.data.token, res.data.userId);
        setSignUpGoogleOpen(false);
        navigate({ to: "/feed" });
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Google registration failed. Please try again.");
    } finally {
      setSignUpGoogleLoading(false);
    }
  };

  // ─── Email/password register or sign-in ──────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!email || !password) { setErrorMsg("Email and password are required."); setLoading(false); return; }
        if (!name.trim()) { setErrorMsg("Full name is required."); setLoading(false); return; }
        const res = await api.post("/auth/register", {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
        });
        if (res.data.requiresVerification) {
          setPendingUserId(res.data.userId);
          setPendingToken(res.data.pendingToken);
          setPendingEmail(email.trim().toLowerCase());
          setPendingRole(role);
          setVerificationRequired(true);
        } else {
          setSession(res.data.token, res.data.userId);
          navigate({ to: role === "driver" ? "/onboarding/driver" : "/onboarding/hiker" });
        }
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
      setErrorMsg(msg.toLowerCase().includes("banned")
        ? "Your account has been suspended due to community safety policy violations."
        : msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Verify PIN ───────────────────────────────────────────────────────────
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!pinInput.trim()) { setErrorMsg("Please enter the verification code."); return; }
    setLoading(true);
    try {
      // Use pending token for the verification call
      localStorage.setItem("hitch_token", pendingToken);
      const res = await api.post("/auth/verify-pin", { pin: pinInput.trim() });
      // Replace pending token with the full session token returned after verification
      setSession(res.data.token, res.data.userId);
      navigate({ to: pendingRole === "driver" ? "/onboarding/driver" : "/onboarding/hiker" });
    } catch (err: any) {
      localStorage.removeItem("hitch_token");
      setErrorMsg(err.response?.data?.error || "Invalid code. Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Cancel registration (rollback) ──────────────────────────────────────
  const handleCancelRegistration = async () => {
    setRollbackLoading(true);
    try {
      await api.post("/auth/rollback-registration", {
        userId: pendingUserId,
        token: pendingToken,
      });
    } catch {
      // Ignore errors — user will be cleaned up by backend TTL or next registration attempt
    } finally {
      setRollbackLoading(false);
      setVerificationRequired(false);
      setPendingUserId("");
      setPendingToken("");
      setPendingEmail("");
      setPinInput("");
      setErrorMsg("");
    }
  };

  // ─── Forgot password ──────────────────────────────────────────────────────
  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotEmail.trim()) { setForgotError("Please enter your account email."); return; }
    setForgotLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail.trim().toLowerCase() });
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
    if (!forgotPin.trim()) { setForgotError("Please enter the 6-digit reset code."); return; }
    if (newPassword.length < 6) { setForgotError("New password must be at least 6 characters."); return; }
    if (newPassword !== confirmNewPassword) { setForgotError("Passwords do not match."); return; }
    setForgotLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: forgotEmail.trim().toLowerCase(),
        pin: forgotPin.trim(),
        newPassword,
      });
      setForgotSuccess("Password updated successfully!");
      setEmail(forgotEmail.trim().toLowerCase());
      setPassword(newPassword);
      setMode("signin");
      setTimeout(resetForgotDialog, 2000);
    } catch (err: any) {
      setForgotError(err.response?.data?.error || "Failed to reset password. Please check your reset code.");
    } finally {
      setForgotLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // VERIFICATION SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (verificationRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 inline-flex items-center gap-2">
            <Mountain className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold">Hitch Connect</span>
          </Link>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                <Mail className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-1 text-center">Check your email</h2>
            <p className="text-sm text-muted-foreground mb-1 text-center">
              We sent a 6-digit verification code to:
            </p>
            <p className="text-sm font-semibold text-foreground text-center mb-5 break-all">
              {pendingEmail}
            </p>

            {errorMsg && (
              <div className="mb-4 rounded-xl bg-destructive/15 p-3.5 text-xs text-destructive font-medium border border-destructive/25 text-center">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground block">Verification Code</label>
                <input
                  id="pin-input"
                  type="text"
                  inputMode="numeric"
                  required
                  autoFocus
                  placeholder="123456"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-xl border bg-secondary/30 px-4 py-3.5 text-lg tracking-[0.5em] text-center font-mono font-bold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                type="submit"
                id="verify-btn"
                disabled={loading || pinInput.length < 6}
                className="w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-md disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Verifying..." : "Verify & Complete Registration"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Didn't receive it? Check your spam folder.
            </p>

            <button
              type="button"
              id="cancel-registration-btn"
              onClick={handleCancelRegistration}
              disabled={rollbackLoading}
              className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-destructive transition cursor-pointer disabled:opacity-50"
            >
              {rollbackLoading ? "Cancelling..." : "Cancel registration & start over"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN AUTH CARD
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 inline-flex items-center gap-2">
          <Mountain className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-bold">Hitch Connect</span>
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

          {/* Tab switcher */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-full bg-muted p-1 text-sm font-medium">
            <button
              id="tab-signup"
              onClick={() => { setMode("signup"); setErrorMsg(""); }}
              className={`rounded-full py-2 transition font-semibold ${mode === "signup" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Create account
            </button>
            <button
              id="tab-signin"
              onClick={() => { setMode("signin"); setErrorMsg(""); }}
              className={`rounded-full py-2 transition font-semibold ${mode === "signin" ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              Sign in
            </button>
          </div>

          {/* ════════════════════════════════════════════════════════
              SIGN IN MODE
              ════════════════════════════════════════════════════════ */}
          {mode === "signin" && (
            <div>
              <form onSubmit={handleSubmit} className="space-y-3 mb-5">
                <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" id="signin-email" />
                <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" id="signin-password" />
                <div className="flex justify-end -mt-1 pb-1">
                  <button
                    type="button"
                    id="forgot-password-btn"
                    onClick={() => { setErrorMsg(""); setForgotEmail(email || ""); setForgotStep("email"); setForgotError(""); setForgotSuccess(""); setForgotModalOpen(true); }}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <button
                  type="submit"
                  id="signin-btn"
                  disabled={loading}
                  className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign in to Account"}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-border" />
                <span className="flex-shrink mx-3 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Or sign in with Google
                </span>
                <div className="flex-grow border-t border-border" />
              </div>

              {/* Google Sign In */}
              {googleClientId && (
                <div id="googleSignInOfficialBtn" className="w-full flex justify-center mb-2 min-h-[40px]" />
              )}
              <button
                type="button"
                id="google-signin-btn"
                onClick={handleOpenGoogleSignIn}
                className="w-full flex items-center justify-center gap-2.5 rounded-full border border-border bg-card py-2.5 text-xs font-semibold text-foreground transition hover:bg-secondary cursor-pointer shadow-sm"
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              CREATE ACCOUNT MODE
              ════════════════════════════════════════════════════════ */}
          {mode === "signup" && (
            <div>
              {/* Role Selection */}
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Step 1: Select Your Role
              </p>
              <div className="mb-5 grid grid-cols-2 gap-3">
                <RoleCard active={role === "hiker"} onClick={() => setRole("hiker")} emoji="🧳" label="Hiker" sub="I need rides" />
                <RoleCard active={role === "driver"} onClick={() => setRole("driver")} emoji="🚐" label="Driver" sub="I offer rides" />
              </div>

              {/* Email Registration Form */}
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Step 2: Create with Email
              </p>
              <form onSubmit={handleSubmit} className="space-y-3 mb-5">
                <Field label="Full name" value={name} onChange={setName} placeholder="e.g. Naledi Sithole" id="signup-name" />
                <Field label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" id="signup-email" />
                <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 6 characters" id="signup-password" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  📧 A verification code will be sent to your email to confirm your account.
                </p>
                <button
                  type="submit"
                  id="signup-btn"
                  disabled={loading}
                  className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Creating account..." : `Create ${role === "driver" ? "Driver" : "Hiker"} Account`}
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-border" />
                <span className="flex-shrink mx-3 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Or register with Google
                </span>
                <div className="flex-grow border-t border-border" />
              </div>

              {/* Google Register — below the email form */}
              {googleClientId && (
                <div id="googleSignUpOfficialBtn" className="w-full flex justify-center mb-2 min-h-[40px]" />
              )}
              <button
                type="button"
                id="google-signup-btn"
                onClick={handleOpenGoogleSignUp}
                className="w-full flex items-center justify-center gap-2.5 rounded-full border border-emerald-500/40 bg-emerald-500/5 py-2.5 text-xs font-semibold text-foreground transition hover:bg-emerald-500/10 cursor-pointer shadow-sm"
              >
                <GoogleIcon />
                <span>Register with Google as {role === "driver" ? "Driver" : "Hiker"}</span>
              </button>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Created by{" "}
          <a href="http://dac-technologies.co.za/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            Dac-Technology
          </a>
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════════
          GOOGLE SIGN-IN DIALOG
          ════════════════════════════════════════════════════════════ */}
      {signInGoogleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                  <GoogleIcon size={20} />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-foreground">Sign In with Google</h2>
                  <p className="text-xs text-muted-foreground">Access your registered Hitch Connect account</p>
                </div>
              </div>
              <button
                type="button"
                id="close-signin-google-btn"
                onClick={() => setSignInGoogleOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-3 rounded-xl bg-destructive/15 p-3 text-xs text-destructive font-medium border border-destructive/25">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSignInGoogleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Your Google Email Address</label>
                <input
                  type="email"
                  required
                  id="google-signin-email"
                  value={signInGoogleEmail}
                  onChange={(e) => setSignInGoogleEmail(e.target.value)}
                  placeholder="e.g. thabo@gmail.com"
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary transition"
                />
              </div>
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSignInGoogleOpen(false)}
                  className="flex-1 rounded-full bg-muted py-2.5 text-xs font-semibold cursor-pointer hover:bg-muted/80 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="google-signin-submit-btn"
                  disabled={signInGoogleLoading}
                  className="flex-1 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 cursor-pointer disabled:opacity-50 transition shadow-sm"
                >
                  {signInGoogleLoading ? "Signing in..." : "Sign In"}
                </button>
              </div>
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setSignInGoogleOpen(false); setMode("signup"); setSignUpGoogleOpen(true); }}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  Don't have an account? Register with Google →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          GOOGLE REGISTER DIALOG
          ════════════════════════════════════════════════════════════ */}
      {signUpGoogleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <GoogleIcon size={20} />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-foreground">Register with Google</h2>
                  <p className="text-xs text-muted-foreground">
                    New {signUpGoogleRole === "driver" ? "Driver" : "Hiker"} account · email verification required
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="close-signup-google-btn"
                onClick={() => setSignUpGoogleOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-secondary transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-3 rounded-xl bg-destructive/15 p-3 text-xs text-destructive font-medium border border-destructive/25">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Role switcher */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">I am registering as:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSignUpGoogleRole("hiker")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer ${signUpGoogleRole === "hiker" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 text-muted-foreground"}`}
                >
                  🧳 Rider / Passenger
                </button>
                <button
                  type="button"
                  onClick={() => setSignUpGoogleRole("driver")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer ${signUpGoogleRole === "driver" ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 text-muted-foreground"}`}
                >
                  🚐 Driver
                </button>
              </div>
            </div>

            <form onSubmit={handleSignUpGoogleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  id="google-signup-name"
                  value={signUpGoogleName}
                  onChange={(e) => setSignUpGoogleName(e.target.value)}
                  placeholder="e.g. Naledi Sithole"
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Google Account Email</label>
                <input
                  type="email"
                  required
                  id="google-signup-email"
                  value={signUpGoogleEmail}
                  onChange={(e) => setSignUpGoogleEmail(e.target.value)}
                  placeholder="e.g. naledi@gmail.com"
                  className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary transition"
                />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                📧 A verification code will be sent to this email to confirm your account.
              </p>
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSignUpGoogleOpen(false)}
                  className="flex-1 rounded-full bg-muted py-2.5 text-xs font-semibold cursor-pointer hover:bg-muted/80 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="google-signup-submit-btn"
                  disabled={signUpGoogleLoading}
                  className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700 py-2.5 text-xs font-semibold text-white cursor-pointer disabled:opacity-50 transition shadow-sm"
                >
                  {signUpGoogleLoading ? "Sending code..." : "Send Verification Code"}
                </button>
              </div>
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setSignUpGoogleOpen(false); setMode("signin"); setSignInGoogleOpen(true); }}
                  className="text-xs text-primary hover:underline font-medium cursor-pointer"
                >
                  Already have an account? Sign in →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          FORGOT PASSWORD MODAL
          ════════════════════════════════════════════════════════════ */}
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
              <button type="button" onClick={resetForgotDialog} className="text-muted-foreground hover:text-foreground p-1 rounded transition cursor-pointer">
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
                      Enter your account email. A reset code will be sent to your inbox.
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
                      <button type="button" onClick={resetForgotDialog} className="flex-1 rounded-full bg-muted py-2.5 text-xs font-medium cursor-pointer">Cancel</button>
                      <button type="submit" disabled={forgotLoading} className="flex-1 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 cursor-pointer disabled:opacity-50">
                        {forgotLoading ? "Checking..." : "Send Reset Code"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <button type="button" onClick={() => { setForgotStep("email"); setForgotError(""); }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-pointer">
                        <ArrowLeft className="h-3 w-3" /> Change email
                      </button>
                      <span className="text-[11px] text-muted-foreground font-mono">{forgotEmail}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Check your inbox for the 6-digit reset code.</p>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Reset Code</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={forgotPin}
                        onChange={(e) => setForgotPin(e.target.value)}
                        placeholder="123456"
                        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none tracking-widest font-mono focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">New Password</label>
                      <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Confirm New Password</label>
                      <input type="password" required minLength={6} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Repeat new password" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="flex gap-2.5 pt-2">
                      <button type="button" onClick={resetForgotDialog} className="flex-1 rounded-full bg-muted py-2.5 text-xs font-medium cursor-pointer">Cancel</button>
                      <button type="submit" disabled={forgotLoading} className="flex-1 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110 cursor-pointer disabled:opacity-50">
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

// ─── Sub-components ───────────────────────────────────────────────────────────
function RoleCard({ active, onClick, emoji, label, sub }: { active: boolean; onClick: () => void; emoji: string; label: string; sub: string }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border-2 p-4 text-left transition cursor-pointer ${active ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
      <div className="text-2xl">{emoji}</div>
      <div className="mt-2 font-semibold">{label}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </button>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, id }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; id?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
    </label>
  );
}
