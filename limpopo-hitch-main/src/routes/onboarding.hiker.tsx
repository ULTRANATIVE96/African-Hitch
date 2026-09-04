import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useCurrentUser, useUpdateProfile } from "@/lib/api-hooks";

export const Route = createFileRoute("/onboarding/hiker")({
  head: () => ({ meta: [{ title: "Hiker onboarding" }] }),
  component: HikerOnboarding,
});

function HikerOnboarding() {
  const { data: user, isLoading } = useCurrentUser();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState(user?.avatar ?? "🧳");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/auth" });
    }
  }, [isLoading, user, navigate]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <OnboardingShell
      title="Welcome, hiker"
      sub="A few details so drivers know who they're picking up."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateProfile.mutate({ phone, avatar });
          navigate({ to: "/feed" });
        }}
        className="space-y-4"
      >
        <AvatarPicker value={avatar} onChange={setAvatar} hiker />
        <TextField label="Phone number" value={phone} onChange={setPhone} placeholder="+27 ..." />
        <button className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground">
          Finish & enter app
        </button>
      </form>
    </OnboardingShell>
  );
}

export function OnboardingShell({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-secondary/40 px-4 py-12">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <p className="mt-1 text-muted-foreground">{sub}</p>
        <div className="mt-6 rounded-2xl border bg-card p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

export function AvatarPicker({
  value,
  onChange,
  hiker,
}: {
  value: string;
  onChange: (v: string) => void;
  hiker?: boolean;
}) {
  const options = hiker
    ? ["🧳", "👨🏾", "👩🏾", "👨🏾‍🦱", "👩🏾‍🦱", "🧑🏾"]
    : ["🧑🏾‍✈️", "👨🏾‍✈️", "👩🏾‍✈️", "🚐", "🚗", "🛻"];
  return (
    <div>
      <span className="mb-2 block text-xs font-medium text-muted-foreground">
        Profile photo (selfie upload coming soon — pick an avatar)
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-2xl transition ${
              value === o ? "border-primary bg-primary/10" : "border-border bg-card"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
