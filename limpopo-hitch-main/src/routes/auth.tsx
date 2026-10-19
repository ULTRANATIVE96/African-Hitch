import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import {
  Mountain,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
  X,
  Mail,
  Lock,
  User as UserIcon,
  Car,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { api, setSession } from "@/lib/api-client";

const searchSchema = z.object({
  role: z.enum(["hiker", "driver"]).optional(),
  banned: z.boolean().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "HikeConnect — Sign in or Register" },
      { name: "description", content: "Sign in or create a hiker or driver account on HikeConnect." },
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

// ─── Hiker Walking Stick Icon ────────────────────────────────────────────────
function HikerIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="2" />
      <path d="M17 21v-5l-3-2-2 3v4" />
      <path d="M7 21l3-6 2-1-1-4 3 2 2-2" />
      <path d="M19 8v13" />
    </svg>
  );
}

function AuthPage() {
  const { role: initialRole, banned } = Route.useSearch();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "signup">(initialRole ? "signup" : "signin");
  const [role, setRole] = useState<Role>(initialRole ?? "hiker");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // PIN verification state
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

  const handleOpenGoogle = () => {
    setErrorMsg("");
    const g = (window as any).google;
    if (googleClientId && g?.accounts?.id) {
      try {
        g.accounts.id.prompt((n: any) => {
          if (n.isNotDisplayed() || n.isSkippedMoment()) {
            if (mode === "signin") setSignInGoogleOpen(true);
            else {
              setSignUpGoogleRole(role);
              setSignUpGoogleOpen(true);
            }
          }
        });
        return;
      } catch {}
    }
    if (mode === "signin") {
      setSignInGoogleOpen(true);
    } else {
      setSignUpGoogleRole(role);
      setSignUpGoogleOpen(true);
    }
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
        if (password !== confirmPassword) { setErrorMsg("Passwords do not match."); setLoading(false); return; }
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
      localStorage.setItem("hitch_token", pendingToken);
      const res = await api.post("/auth/verify-pin", { pin: pinInput.trim() });
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
      // Ignore
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
      <div className="flex min-h-screen items-center justify-center bg-[#fcfbf7] px-4 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 inline-flex items-center gap-2">
            <Mountain className="h-5 w-5 text-[#14382b]" />
            <span className="font-display text-lg font-bold text-[#14382b]">HikeConnect</span>
          </Link>
          <div className="rounded-3xl border border-[#e8e4d8] bg-white p-7 shadow-xs text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffeedb] text-[#c85a17] border border-[#fed7aa]">
                <Mail className="h-7 w-7" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-1 text-[#111827]">Check your email</h2>
            <p className="text-xs text-[#71717a] mb-1">
              We sent a 6-digit verification code to:
            </p>
            <p className="text-sm font-semibold text-[#14382b] mb-5 break-all">
              {pendingEmail}
            </p>

            {errorMsg && (
              <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium border border-red-200">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-[#4b5563] block">Verification Code</label>
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
                  className="w-full rounded-xl border border-[#e8e4d8] bg-[#fcfbf7] px-4 py-3 text-lg tracking-[0.5em] text-center font-mono font-bold focus:border-[#14382b] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                id="verify-btn"
                disabled={loading || pinInput.length < 6}
                className="w-full rounded-xl bg-[#14382b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1b4a3a] disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {loading ? "Verifying..." : "Verify & Complete Registration"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-[#71717a]">
              Didn't receive it? Check your spam folder.
            </p>

            <button
              type="button"
              id="cancel-registration-btn"
              onClick={handleCancelRegistration}
              disabled={rollbackLoading}
              className="mt-3 w-full text-center text-xs text-[#71717a] hover:text-red-600 transition cursor-pointer disabled:opacity-50"
            >
              {rollbackLoading ? "Cancelling..." : "Cancel registration & start over"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MAIN AUTH SCREEN (MATCHING MOCKUP IMAGE EXACTLY)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen w-full bg-[#fcfbf7] text-[#1f2937] p-2 sm:p-4 lg:p-6 flex items-center justify-center">
      {/* Outer Card Frame covering the entire page / blending with viewport */}
      <div className="w-full min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] lg:min-h-[calc(100vh-3rem)] rounded-[2rem] sm:rounded-[2.5rem] border border-[#e8e4d8] bg-[#fcfbf7] p-6 sm:p-8 lg:p-10 shadow-xs flex flex-col justify-between relative overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between pb-4 sm:pb-6 relative z-20">
          <Link to="/" className="flex items-center gap-2.5 group">
            {/* HikeConnect Logo: Double Mountain Peaks with Snowcap Cutouts */}
            <svg className="h-7 w-9 text-[#1b4332]" viewBox="0 0 36 28" fill="none">
              {/* Back / Left Peak */}
              <polygon points="3,25 12,8 21,25" fill="#1b4332" />
              <polygon points="12,8 9.5,13 12,14.5 14.5,13" fill="#fcfbf7" />
              {/* Front / Right Peak */}
              <polygon points="13,25 23,4 33,25" fill="#1b4332" />
              <polygon points="23,4 19.5,11 23,13 26.5,11" fill="#fcfbf7" />
            </svg>
            <span className="font-display text-2xl font-extrabold tracking-tight text-[#1b4332]">
              HikeConnect
            </span>
          </Link>
          <div className="text-xs text-[#71717a] font-medium hidden sm:block tracking-wide">
            More Rides. More Trails. Together.
          </div>
        </header>

        {/* Two-Column Grid: Decorative Left Panel + Floating Form Card */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-2 sm:py-4">
          {/* ═══════════ LEFT DECORATIVE SECTION ═══════════ */}
          <div className="lg:col-span-7 xl:col-span-7 relative flex flex-col justify-between h-full min-h-[440px] sm:min-h-[520px] lg:min-h-[600px] overflow-hidden rounded-2xl">
            {/* Catchphrase text matching exact crop */}
            <div className="relative z-10 pt-1 text-[#3e5444] text-base sm:text-lg font-semibold leading-snug max-w-xs">
              {mode === "signup" ? (
                <>
                  <p>Real people.</p>
                  <p>Safe rides.</p>
                  <p>Greater adventures.</p>
                </>
              ) : (
                <>
                  <p>Same trails.</p>
                  <p>New journeys.</p>
                  <p>Log in and keep</p>
                  <p>moving.</p>
                </>
              )}
            </div>

            {/* Landscape Illustration: Misty Mountain Layers, Dotted Trail, Map Pin, and Hiker */}
            <div className="absolute inset-0 pointer-events-none select-none">
              <svg className="w-full h-full" viewBox="0 0 520 620" fill="none" preserveAspectRatio="xMidYMax meet">
                {/* Layer 1: Distant Misty Sky Glow & Faint Mountain Slope */}
                <path
                  d="M0 400 C120 340, 240 370, 360 280 C430 230, 480 260, 520 290 L520 620 L0 620 Z"
                  fill="#edf3ec"
                />

                {/* Layer 2: Mid-distance Mountain Ridge with Slopes */}
                <path
                  d="M0 450 C90 410, 180 390, 280 360 C370 330, 450 390, 520 410 L520 620 L0 620 Z"
                  fill="#dce7db"
                />

                {/* Layer 3: Closer Mountain Ridge */}
                <path
                  d="M0 490 C110 460, 200 460, 310 440 C410 420, 470 470, 520 490 L520 620 L0 620 Z"
                  fill="#c8d8c7"
                />

                {/* Curved Dotted Trail Loop curving down to Hiker */}
                <path
                  d="M170 460 C155 380, 220 310, 255 240 C280 190, 310 160, 325 115"
                  stroke="#7f9382"
                  strokeWidth="2.5"
                  strokeDasharray="5 6"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Teardrop Destination Map Pin Marker at Top of Trail */}
                <g transform="translate(315, 90)">
                  <path
                    d="M10 2 C5.58 2 2 5.58 2 10 C2 15.5 10 23 10 23 C10 23 18 15.5 18 10 C18 5.58 14.42 2 10 2 Z"
                    fill="#304838"
                  />
                  {/* Pin hollow inner circle */}
                  <circle cx="10" cy="10" r="3.2" fill="#fcfbf7" />
                </g>

                {/* Foreground Rocks & Boulders */}
                {/* Back boulder */}
                <path
                  d="M20 620 L30 550 C60 520, 120 510, 170 540 C210 565, 240 595, 270 620 Z"
                  fill="#788c7a"
                />
                {/* Front boulder */}
                <path
                  d="M-10 620 L0 570 C40 560, 90 545, 140 560 C190 575, 230 610, 250 620 Z"
                  fill="#546b57"
                />

                {/* Leaves & Fronds on Rocky Mound */}
                {/* Left grasses */}
                <path
                  d="M25 570 C15 540, 30 535, 38 555 C42 530, 60 535, 55 560"
                  fill="#3d5341"
                />
                <path
                  d="M5 580 C-5 555, 10 550, 15 570"
                  fill="#3d5341"
                />
                {/* Right branch with leaves */}
                <g transform="translate(185, 530)">
                  <path d="M10 60 C18 45, 28 30, 35 15" stroke="#3d5341" strokeWidth="2.5" strokeLinecap="round" />
                  <ellipse cx="20" cy="50" rx="6" ry="3" transform="rotate(-30 20 50)" fill="#3d5341" />
                  <ellipse cx="32" cy="40" rx="6" ry="3" transform="rotate(20 32 40)" fill="#3d5341" />
                  <ellipse cx="26" cy="28" rx="6" ry="3" transform="rotate(-40 26 28)" fill="#3d5341" />
                  <ellipse cx="38" cy="20" rx="6" ry="3" transform="rotate(15 38 20)" fill="#3d5341" />
                  <ellipse cx="36" cy="10" rx="5" ry="3" transform="rotate(-30 36 10)" fill="#3d5341" />
                </g>

                {/* Detailed Hiker Figure */}
                <g transform="translate(85, 420)">
                  {/* Peaked Trail Cap / Head */}
                  <circle cx="34" cy="14" r="6" fill="#3d5341" />
                  <path d="M26 13 C26 10, 42 9, 44 14 Z" fill="#3d5341" />
                  <path d="M42 14 L49 14.5 C49 14.5, 46 12, 42 12 Z" fill="#3d5341" />

                  {/* Backpack */}
                  <path
                    d="M18 20 C14 20, 11 28, 12 38 C12 45, 16 48, 20 47 L21 24 Z"
                    fill="#2a3c2e"
                  />

                  {/* Upper body / Jacket & Vest */}
                  <path
                    d="M26 20 C31 20, 36 21, 38 27 L36 43 C32 46, 26 46, 21 44 L23 25 Z"
                    fill="#6e8471"
                  />
                  <path
                    d="M27 21 L35 27 L33 43 L27 44 Z"
                    fill="#3d5341"
                    opacity="0.85"
                  />

                  {/* Left Arm holding Trekking Stick */}
                  <path
                    d="M34 26 L42 38 L40 46"
                    stroke="#3d5341"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  {/* Right Arm */}
                  <path
                    d="M26 25 L23 37"
                    stroke="#2a3c2e"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />

                  {/* Trekking Pole / Walking Stick */}
                  <line
                    x1="41"
                    y1="38"
                    x2="47"
                    y2="92"
                    stroke="#26362d"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />

                  {/* Legs in Hiking Trousers & Boots */}
                  {/* Front Leg (stepping forward) */}
                  <path
                    d="M32 44 L35 62 L40 82 L46 84"
                    stroke="#3d5341"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  {/* Back Leg */}
                  <path
                    d="M25 44 L20 60 L18 80 L13 83"
                    stroke="#2a3c2e"
                    strokeWidth="4.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </g>

                {/* White bottom slope matching the mockup's bottom white ground cut */}
                <path
                  d="M-10 620 L-10 590 C80 580, 200 600, 360 580 C440 570, 500 590, 530 600 L530 620 Z"
                  fill="#fcfbf7"
                />
              </svg>
            </div>
          </div>

          {/* ═══════════ RIGHT FORM CARD ═══════════ */}
          <div className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end relative z-20">
            <div className="w-full max-w-[440px] rounded-3xl border border-[#e8e4d8] bg-white p-7 sm:p-9 shadow-sm">
              {banned && (
                <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium border border-red-200 text-center animate-pulse">
                  ❌ Your account has been suspended due to 10 or more community safety flags.
                </div>
              )}
              {errorMsg && (
                <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium border border-red-200 text-center">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* ════════════════════════════════════════════════════
                  SIGN UP VIEW (Create your HikeConnect account)
                  ════════════════════════════════════════════════════ */}
              {mode === "signup" ? (
                <div>
                  <h1 className="font-display text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#14382b] leading-[1.18]">
                    Create your
                    <br />
                    HikeConnect account
                  </h1>
                  <p className="mt-1 mb-4 text-xs sm:text-sm text-[#71717a]">
                    Choose how you'll use HikeConnect
                  </p>

                  {/* Role Selector Cards: Hiker & Driver */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* Hiker Card */}
                    <button
                      type="button"
                      onClick={() => setRole("hiker")}
                      className={`relative flex flex-col justify-between p-3.5 rounded-2xl text-left transition cursor-pointer ${
                        role === "hiker"
                          ? "border-2 border-[#14382b] bg-[#f4f7f5]"
                          : "border border-[#e8e4d8] bg-white hover:border-[#14382b]/40"
                      }`}
                    >
                      {role === "hiker" && (
                        <div className="absolute top-2.5 right-2.5 h-4 w-4 rounded-full bg-[#14382b] text-white flex items-center justify-center shadow-xs">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                      )}
                      <div className="h-6 w-6 text-[#14382b] mb-2">
                        <HikerIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#111827]">Hiker</div>
                        <div className="text-[11px] text-[#71717a]">Find rides</div>
                      </div>
                    </button>

                    {/* Driver Card */}
                    <button
                      type="button"
                      onClick={() => setRole("driver")}
                      className={`relative flex flex-col justify-between p-3.5 rounded-2xl text-left transition cursor-pointer ${
                        role === "driver"
                          ? "border-2 border-[#14382b] bg-[#f4f7f5]"
                          : "border border-[#e8e4d8] bg-white hover:border-[#14382b]/40"
                      }`}
                    >
                      {role === "driver" && (
                        <div className="absolute top-2.5 right-2.5 h-4 w-4 rounded-full bg-[#14382b] text-white flex items-center justify-center shadow-xs">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </div>
                      )}
                      <div className="h-6 w-6 text-[#14382b] mb-2">
                        <Car className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#111827]">Driver</div>
                        <div className="text-[11px] text-[#71717a]">Offer rides</div>
                      </div>
                    </button>
                  </div>

                  {/* Dark Green Google Button */}
                  <button
                    type="button"
                    onClick={handleOpenGoogle}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#14382b] hover:bg-[#1b4a3a] py-3 px-4 text-xs sm:text-sm font-semibold text-white transition shadow-xs cursor-pointer mb-3.5"
                  >
                    <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center">
                      <GoogleIcon size={13} />
                    </div>
                    <span>Continue with Google</span>
                  </button>

                  {/* Divider: OR */}
                  <div className="relative flex py-1.5 items-center mb-3.5">
                    <div className="flex-grow border-t border-[#e8e4d8]" />
                    <span className="flex-shrink mx-3 text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">
                      OR
                    </span>
                    <div className="flex-grow border-t border-[#e8e4d8]" />
                  </div>

                  {/* Registration Form */}
                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-[#4b5563] mb-1">Full name</label>
                      <div className="relative">
                        <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Naledi Sithole"
                          className="w-full rounded-xl border border-[#e4e1d6] bg-white pl-10 pr-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#14382b] transition"
                        />
                      </div>
                    </div>

                    {/* Email address */}
                    <div>
                      <label className="block text-xs font-semibold text-[#4b5563] mb-1">Email address</label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-[#e4e1d6] bg-white pl-10 pr-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#14382b] transition"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-[#4b5563] mb-1">Password</label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a strong password"
                          className="w-full rounded-xl border border-[#e4e1d6] bg-white pl-10 pr-10 py-2.5 text-sm text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#14382b] transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#4b5563] p-1 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm password */}
                    <div>
                      <label className="block text-xs font-semibold text-[#4b5563] mb-1">Confirm password</label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter your password"
                          className="w-full rounded-xl border border-[#e4e1d6] bg-white pl-10 pr-10 py-2.5 text-sm text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#14382b] transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#4b5563] p-1 cursor-pointer"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-[#14382b] hover:bg-[#1b4a3a] py-3 text-sm font-semibold text-white transition shadow-xs cursor-pointer disabled:opacity-50 mt-1"
                    >
                      {loading ? "Creating account..." : "Create account"}
                    </button>
                  </form>

                  {/* Switch to Sign In */}
                  <div className="mt-4 text-center text-xs text-[#71717a]">
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      onClick={() => { setMode("signin"); setErrorMsg(""); }}
                      className="font-bold text-[#14382b] hover:underline cursor-pointer"
                    >
                      Sign in
                    </button>
                  </div>
                </div>
              ) : (
                /* ════════════════════════════════════════════════════
                   SIGN IN VIEW (Welcome back)
                   ════════════════════════════════════════════════════ */
                <div>
                  <h1 className="font-display text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#14382b] leading-tight">
                    Welcome back
                  </h1>
                  <p className="mt-1 mb-5 text-xs sm:text-sm text-[#71717a]">
                    Sign in to continue your journey
                  </p>

                  {/* Dark Green Google Button */}
                  <button
                    type="button"
                    onClick={handleOpenGoogle}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#14382b] hover:bg-[#1b4a3a] py-3 px-4 text-xs sm:text-sm font-semibold text-white transition shadow-xs cursor-pointer mb-4"
                  >
                    <div className="h-5 w-5 rounded-full bg-white flex items-center justify-center">
                      <GoogleIcon size={13} />
                    </div>
                    <span>Continue with Google</span>
                  </button>

                  {/* Divider: OR */}
                  <div className="relative flex py-2 items-center mb-4">
                    <div className="flex-grow border-t border-[#e8e4d8]" />
                    <span className="flex-shrink mx-3 text-[11px] font-semibold text-[#a1a1aa] uppercase tracking-wider">
                      OR
                    </span>
                    <div className="flex-grow border-t border-[#e8e4d8]" />
                  </div>

                  {/* Sign In Form */}
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {/* Email address */}
                    <div>
                      <label className="block text-xs font-semibold text-[#4b5563] mb-1">Email address</label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-[#e4e1d6] bg-white pl-10 pr-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#14382b] transition"
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold text-[#4b5563] mb-1">Password</label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full rounded-xl border border-[#e4e1d6] bg-white pl-10 pr-10 py-2.5 text-sm text-[#111827] placeholder:text-[#9ca3af] outline-none focus:border-[#14382b] transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#4b5563] p-1 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Forgot password link */}
                      <div className="flex justify-end pt-1.5">
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
                          className="text-xs font-semibold text-[#14382b] hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-[#14382b] hover:bg-[#1b4a3a] py-3 text-sm font-semibold text-white transition shadow-xs cursor-pointer disabled:opacity-50 mt-1"
                    >
                      {loading ? "Signing in..." : "Sign in"}
                    </button>
                  </form>

                  {/* Switch to Sign Up */}
                  <div className="mt-5 text-center text-xs text-[#71717a]">
                    <span>New to HikeConnect? </span>
                    <button
                      type="button"
                      onClick={() => { setMode("signup"); setErrorMsg(""); }}
                      className="font-bold text-[#14382b] hover:underline cursor-pointer"
                    >
                      Create an account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════
          GOOGLE SIGN-IN DIALOG
          ════════════════════════════════════════════════════════════ */}
      {signInGoogleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#e8e4d8] text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#14382b]/10 border border-[#14382b]/20">
                  <GoogleIcon size={18} />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-[#111827]">Sign In with Google</h2>
                  <p className="text-xs text-[#71717a]">Access your HikeConnect account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSignInGoogleOpen(false)}
                className="text-[#9ca3af] hover:text-[#111827] p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-3 rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium border border-red-200">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleSignInGoogleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#4b5563] mb-1">Your Google Email Address</label>
                <input
                  type="email"
                  required
                  value={signInGoogleEmail}
                  onChange={(e) => setSignInGoogleEmail(e.target.value)}
                  placeholder="e.g. thabo@gmail.com"
                  className="w-full rounded-xl border border-[#e4e1d6] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#14382b] transition"
                />
              </div>
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSignInGoogleOpen(false)}
                  className="flex-1 rounded-xl border border-[#e4e1d6] bg-white py-2.5 text-xs font-semibold text-[#4b5563] hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={signInGoogleLoading}
                  className="flex-1 rounded-xl bg-[#14382b] py-2.5 text-xs font-semibold text-white hover:bg-[#1b4a3a] cursor-pointer disabled:opacity-50 transition shadow-xs"
                >
                  {signInGoogleLoading ? "Signing in..." : "Sign In"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#e8e4d8] text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200">
                  <GoogleIcon size={18} />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-[#111827]">Register with Google</h2>
                  <p className="text-xs text-[#71717a]">
                    New {signUpGoogleRole === "driver" ? "Driver" : "Hiker"} account
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSignUpGoogleOpen(false)}
                className="text-[#9ca3af] hover:text-[#111827] p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-3 rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium border border-red-200">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Role switcher */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#4b5563] mb-1.5">I am registering as:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSignUpGoogleRole("hiker")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer ${signUpGoogleRole === "hiker" ? "border-[#14382b] bg-[#f4f7f5] text-[#14382b]" : "border-[#e8e4d8] text-[#71717a]"}`}
                >
                  <HikerIcon className="h-4 w-4" /> Hiker
                </button>
                <button
                  type="button"
                  onClick={() => setSignUpGoogleRole("driver")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition cursor-pointer ${signUpGoogleRole === "driver" ? "border-[#14382b] bg-[#f4f7f5] text-[#14382b]" : "border-[#e8e4d8] text-[#71717a]"}`}
                >
                  <Car className="h-4 w-4" /> Driver
                </button>
              </div>
            </div>

            <form onSubmit={handleSignUpGoogleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#4b5563] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={signUpGoogleName}
                  onChange={(e) => setSignUpGoogleName(e.target.value)}
                  placeholder="e.g. Naledi Sithole"
                  className="w-full rounded-xl border border-[#e4e1d6] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#14382b] transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#4b5563] mb-1">Google Account Email</label>
                <input
                  type="email"
                  required
                  value={signUpGoogleEmail}
                  onChange={(e) => setSignUpGoogleEmail(e.target.value)}
                  placeholder="e.g. naledi@gmail.com"
                  className="w-full rounded-xl border border-[#e4e1d6] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#14382b] transition"
                />
              </div>
              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSignUpGoogleOpen(false)}
                  className="flex-1 rounded-xl border border-[#e4e1d6] bg-white py-2.5 text-xs font-semibold text-[#4b5563] hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={signUpGoogleLoading}
                  className="flex-1 rounded-xl bg-[#14382b] hover:bg-[#1b4a3a] py-2.5 text-xs font-semibold text-white cursor-pointer disabled:opacity-50 transition shadow-xs"
                >
                  {signUpGoogleLoading ? "Creating..." : "Create with Google"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#e8e4d8] text-left">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#14382b]/10 flex items-center justify-center text-[#14382b]">
                  <KeyRound className="h-4 w-4" />
                </div>
                <h2 className="font-display text-lg font-bold text-[#111827]">Reset Password</h2>
              </div>
              <button
                type="button"
                onClick={resetForgotDialog}
                className="text-[#9ca3af] hover:text-[#111827] p-1 rounded transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {forgotSuccess ? (
              <div className="space-y-4 py-3 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-[#111827]">Password Reset Successful!</h3>
                  <p className="text-xs text-[#71717a]">{forgotSuccess}</p>
                </div>
                <p className="text-[11px] text-[#14382b] font-semibold animate-pulse">Switching to sign in...</p>
              </div>
            ) : (
              <>
                {forgotError && (
                  <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 font-medium border border-red-200 text-center">
                    ⚠️ {forgotError}
                  </div>
                )}
                {forgotStep === "email" ? (
                  <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                    <p className="text-xs text-[#71717a] leading-relaxed">
                      Enter your account email. A reset code will be sent to your inbox.
                    </p>
                    <div>
                      <label className="block text-xs font-semibold text-[#4b5563] mb-1">Account Email</label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-[#e4e1d6] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#14382b]"
                      />
                    </div>
                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={resetForgotDialog}
                        className="flex-1 rounded-xl border border-[#e4e1d6] bg-white py-2.5 text-xs font-semibold text-[#4b5563] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="flex-1 rounded-xl bg-[#14382b] py-2.5 text-xs font-semibold text-white hover:bg-[#1b4a3a] cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        {forgotLoading ? "Checking..." : "Send Reset Code"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => { setForgotStep("email"); setForgotError(""); }}
                        className="inline-flex items-center gap-1 text-xs text-[#71717a] hover:text-[#111827] cursor-pointer"
                      >
                        <ArrowLeft className="h-3 w-3" /> Change email
                      </button>
                      <span className="text-[11px] text-[#71717a] font-mono">{forgotEmail}</span>
                    </div>
                    <p className="text-[11px] text-[#71717a]">Check your inbox for the 6-digit reset code.</p>
                    <div>
                      <label className="block text-xs font-semibold text-[#4b5563] mb-1">Reset Code</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={forgotPin}
                        onChange={(e) => setForgotPin(e.target.value)}
                        placeholder="123456"
                        className="w-full rounded-xl border border-[#e4e1d6] bg-white px-3.5 py-2.5 text-sm outline-none tracking-widest font-mono focus:border-[#14382b]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4b5563] mb-1">New Password</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full rounded-xl border border-[#e4e1d6] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#14382b]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#4b5563] mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full rounded-xl border border-[#e4e1d6] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#14382b]"
                      />
                    </div>
                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={resetForgotDialog}
                        className="flex-1 rounded-xl border border-[#e4e1d6] bg-white py-2.5 text-xs font-semibold text-[#4b5563] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="flex-1 rounded-xl bg-[#14382b] py-2.5 text-xs font-semibold text-white hover:bg-[#1b4a3a] cursor-pointer disabled:opacity-50 shadow-xs"
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
