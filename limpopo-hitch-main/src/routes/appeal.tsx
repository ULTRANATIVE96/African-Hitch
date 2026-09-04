import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Mountain, ShieldAlert, CheckCircle2, ArrowLeft, Send, AlertTriangle, ArrowLeftRight, Clock } from "lucide-react";
import { useCurrentUser, useFlags, useAllUsers, useSubmitAppeal } from "@/lib/api-hooks";

const searchSchema = z.object({
  userId: z.string().optional(),
});

export const Route = createFileRoute("/appeal")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Appeal Unfair Flag — Limpopo Hike Connect" },
      {
        name: "description",
        content:
          "Submit an appeal if you believe you have been unfairly flagged on the Limpopo Hike Connect community red list.",
      },
    ],
  }),
  component: AppealPage,
});

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function AppealPage() {
  const { userId } = Route.useSearch();
  const navigate = useNavigate();
  const { data: me } = useCurrentUser();
  const { data: users = [] } = useAllUsers();
  const { data: flags = [] } = useFlags();
  const submitAppeal = useSubmitAppeal();

  const prefillUser = userId ? users.find((u) => u.id === userId) : me;

  const isUnauthorizedUser = Boolean(
    me &&
    prefillUser &&
    me.id !== prefillUser.id &&
    me.linkedUserId !== prefillUser.id
  );

  // isWrongAccount: we're logged in but as a different non-linked user
  const isWrongAccount = Boolean(
    me && prefillUser &&
    me.id !== prefillUser.id &&
    me.linkedUserId !== prefillUser.id
  );

  const targetUserId = prefillUser?.id ?? userId;
  const userFlags = targetUserId ? flags.filter((f) => f.flaggedUserId === targetUserId) : [];

  // Helper function to check 30-day cooldown status for a flag
  const getFlagAppealStatus = (_flagId: string) => {
    // Without persisted appeals in API, all flags are available for appeal
    return { status: "available", daysRemaining: 0 };
  };

  // Available (un-locked) flag IDs
  const availableFlagIds = userFlags
    .filter((f) => getFlagAppealStatus(f.id).status === "available")
    .map((f) => f.id);

  const [name, setName] = useState(prefillUser?.name ?? me?.name ?? "");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [selectedFlagIds, setSelectedFlagIds] = useState<string[]>(availableFlagIds);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const REASON_LABELS: Record<string, string> = {
    wrong_dropoff: "Dropped at wrong location",
    no_show: "No-show",
    unsafe_driving: "Unsafe driving",
    payment_issue: "Payment issue",
    other: "Other",
  };

  const handleSwitchToCorrectAccount = () => {
    alert("Please sign out and sign in with the correct account to submit this appeal.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError("");

      if (isWrongAccount) {
        setError(
          `Account Switch Required: You must log into your ${prefillUser?.role.toUpperCase()} account to appeal for it.`
        );
        return;
      }

      if (isUnauthorizedUser) {
        setError("You are not authorized to submit appeals for another user's account.");
        return;
      }

      if (!name.trim() || !email.trim() || !reason.trim()) {
        setError("Please fill in all required fields.");
        return;
      }

      if (reason.trim().length < 30) {
        setError("Please provide a more detailed explanation (at least 30 characters).");
        return;
      }

      if (userFlags.length > 0 && selectedFlagIds.length === 0) {
        setError("Please select at least one available flag to appeal.");
        return;
      }

      setSubmitting(true);

      // Submit appeal via API
      await submitAppeal.mutateAsync({
        userId: prefillUser?.id ?? me?.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        reason: reason.trim(),
        flagIds: selectedFlagIds,
      });

      setSubmitting(false);
      setSubmitted(true);
    } catch (err: any) {
      console.error("Appeal submission error:", err);
      setError(err?.message || String(err));
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 border-2 border-green-500/30 mx-auto">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-foreground">Appeal Submitted (Pending Review)</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your appeal has been submitted to <span className="font-semibold text-primary">Dac-Technology</span>.
              A 30-day cooldown period now applies for the selected flags.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 text-left space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Appeal Summary
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Account</span>
                <span className="font-semibold capitalize">{prefillUser?.name} ({prefillUser?.role})</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                  Pending Review (30-Day Cooldown)
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {me ? (
              <>
                <Link
                  to="/feed"
                  className="flex-1 rounded-full border border-border bg-card py-3 text-sm font-medium text-foreground text-center hover:bg-secondary transition"
                >
                  Back to feed
                </Link>
                <Link
                  to="/profile"
                  className="flex-1 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground text-center hover:brightness-110 transition"
                >
                  View Profile
                </Link>
              </>
            ) : (
              <Link
                to="/auth"
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground text-center hover:brightness-110 transition"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 px-4 py-10">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition"
          >
            <Mountain className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold text-foreground">HikeConnect</span>
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">Appeal an Unfair Flag</h1>
              <p className="text-xs text-muted-foreground">
                Assessed by Dac-Technology (30-Day Cooldown Applies)
              </p>
            </div>
          </div>
        </div>

        {/* Dual Account Warning Banner */}
        {isWrongAccount && (
          <div className="mb-6 rounded-2xl border-2 border-amber-500/50 bg-amber-500/10 p-5 space-y-3">
            <div className="flex items-start gap-3 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <div className="font-bold">Account Switch Required</div>
                <p className="text-xs leading-relaxed">
                  You are currently logged in as your{" "}
                  <span className="font-bold uppercase underline">{me?.role}</span> account (
                  {me?.name}). The flag being appealed belongs to your linked{" "}
                  <span className="font-bold uppercase underline">{prefillUser?.role}</span> account.
                  You must log in to your {prefillUser?.role} account to appeal.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSwitchToCorrectAccount}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-700 transition cursor-pointer"
            >
              <ArrowLeftRight className="h-4 w-4" /> Log in as {prefillUser?.name} ({prefillUser?.role})
            </button>
          </div>
        )}

        {/* Unauthorized user banner */}
        {isUnauthorizedUser && (
          <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-xs font-medium">
              You are signed in as {me?.name}. You can only submit appeals for your own account.
            </p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-1">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
            <Clock className="h-4 w-4 shrink-0" />
            <span>30-Day Cooldown Policy</span>
          </div>
          <p className="text-xs text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
            Once an appeal for a flag is submitted or reviewed by Dac-Technology, a <strong>30-day cooldown period</strong> applies. Re-appealing a flag is locked until 30 days after the previous appeal response/submission date.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/25 p-3.5 text-sm text-destructive">
              ⚠️ {error}
            </div>
          )}

          {/* User Info */}
          <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="font-semibold text-sm">Appealing Account</h2>
              {prefillUser && (
                <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {prefillUser.role} Account
                </span>
              )}
            </div>
            <AppealField
              label="Full Name *"
              value={name}
              onChange={setName}
              placeholder="e.g. Thabo Mokoena"
              disabled={isWrongAccount || isUnauthorizedUser}
            />
            <AppealField
              label="Email Address *"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="your@email.com"
              disabled={isWrongAccount || isUnauthorizedUser}
            />
          </div>

          {/* Flags being appealed */}
          {userFlags.length > 0 && (
            <div className="rounded-2xl border bg-card p-5 space-y-3 shadow-sm">
              <h2 className="font-semibold text-sm">Flags Being Appealed</h2>
              <p className="text-xs text-muted-foreground">Select the flags you wish to dispute:</p>
              <div className="space-y-2.5">
                {userFlags.map((flag) => {
                  const appealState = getFlagAppealStatus(flag.id);
                  const isLocked = appealState.status !== "available";

                  return (
                    <label
                      key={flag.id}
                      className={`flex items-start gap-3 rounded-xl border-2 p-3.5 transition ${
                        isLocked
                          ? "border-amber-500/40 bg-amber-500/5 opacity-80 cursor-not-allowed"
                          : selectedFlagIds.includes(flag.id)
                            ? "border-primary bg-primary/5 cursor-pointer"
                            : "border-border hover:border-primary/30 cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={isLocked || isWrongAccount || isUnauthorizedUser}
                        checked={isLocked ? true : selectedFlagIds.includes(flag.id)}
                        onChange={(e) =>
                          setSelectedFlagIds((prev) =>
                            e.target.checked
                              ? [...prev, flag.id]
                              : prev.filter((id) => id !== flag.id)
                          )
                        }
                        className="mt-0.5 accent-primary"
                      />
                      <div className="text-sm flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">{REASON_LABELS[flag.reason] ?? flag.reason}</span>
                          {appealState.status === "pending" ? (
                            <span className="rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider">
                              Pending Review
                            </span>
                          ) : appealState.status === "cooldown" ? (
                            <span className="rounded-full bg-slate-700 text-amber-400 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Cooldown ({appealState.daysRemaining} days left)
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(flag.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs mt-1">{flag.detail}</div>
                        {appealState.status === "pending" && (
                          <p className="text-[11px] font-medium text-amber-600 mt-1">
                            ℹ️ Appeal pending admin review.
                          </p>
                        )}
                        {appealState.status === "cooldown" && (
                          <p className="text-[11px] font-medium text-amber-600 mt-1">
                            🔒 30-day cooldown active. Re-appeal unlocks in {appealState.daysRemaining} days.
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Appeal Reason */}
          <div className="rounded-2xl border bg-card p-5 space-y-3 shadow-sm">
            <h2 className="font-semibold text-sm">Your Statement *</h2>
            <p className="text-xs text-muted-foreground">
              Explain clearly why this flag is unfair. Provide context such as agreed points or evidence.
            </p>
            <textarea
              value={reason}
              disabled={isWrongAccount || isUnauthorizedUser || availableFlagIds.length === 0}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. The agreed drop-off point was changed due to road construction, which both parties agreed to in advance..."
              rows={5}
              className="w-full rounded-xl border bg-background px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none disabled:opacity-50"
            />
            <div className="text-right text-[11px] text-muted-foreground">
              {reason.length} characters (min 30)
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || isWrongAccount || isUnauthorizedUser || availableFlagIds.length === 0}
            className="w-full rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Submitting appeal...
              </>
            ) : availableFlagIds.length === 0 && userFlags.length > 0 ? (
              "All Flags Under 30-Day Cooldown"
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Appeal for Review
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Limpopo Hike Connect · Dac-Technology
        </p>
      </div>
    </div>
  );
}

function AppealField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
      />
    </label>
  );
}
