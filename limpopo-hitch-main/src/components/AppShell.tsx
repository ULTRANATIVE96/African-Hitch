import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Compass,
  PlusCircle,
  Inbox,
  ShieldAlert,
  Wallet,
  User as UserIcon,
  Mountain,
} from "lucide-react";
import { useCurrentUser } from "@/lib/api-hooks";
import { clearSession } from "@/lib/api-client";
import { UserAvatar } from "./UserAvatar";

const TABS = [
  { to: "/feed", label: "Feed", icon: Compass },
  { to: "/post", label: "Post", icon: PlusCircle },
  { to: "/requests", label: "Requests", icon: Inbox },
  { to: "/redlist", label: "Red list", icon: ShieldAlert },
  { to: "/payments", label: "Pay", icon: Wallet },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function AppShell() {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDownload, setShowDownload] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Handle ban check client-side
  useEffect(() => {
    if (!user) return;
    if (user.banned) {
      clearSession();
      navigate({ to: "/auth", search: { banned: true } });
    }
  }, [user?.id, user?.banned]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem("hitch_download_prompt")) {
      const timer = setTimeout(() => {
        setShowDownload(true);
        sessionStorage.setItem("hitch_download_prompt", "true");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/feed" className="flex items-center gap-2">
            <Mountain className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold tracking-tight">
              Hike<span className="text-primary">Connect</span>
            </span>
          </Link>
          {user && (
            <Link to="/profile" className="flex items-center gap-2 text-sm hover:opacity-90 transition">
              <span className="hidden text-muted-foreground sm:inline">{user.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.role === "driver" ? "bg-primary/15 text-primary" : "bg-accent/20 text-accent"
                }`}
              >
                {user.role}
              </span>
              <UserAvatar
                user={user}
                className="h-7 w-7 text-xl flex items-center justify-center rounded-full bg-secondary overflow-hidden object-cover"
              />
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-stretch justify-between px-1">
          {TABS.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {showDownload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mountain className="h-8 w-8" />
            </div>
            <h2 className="font-display text-2xl font-bold">Get the App!</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              For the best Limpopo Hike Connect experience, real-time tracking, and instant notifications, download our mobile app.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button 
                onClick={() => {
                  if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then(() => {
                      setDeferredPrompt(null);
                      setShowDownload(false);
                    });
                  } else {
                    alert("App installation is not currently available in this browser, or it's already installed.");
                    setShowDownload(false);
                  }
                }}
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:brightness-110 transition cursor-pointer"
              >
                Download Now
              </button>
              <button
                onClick={() => setShowDownload(false)}
                className="text-xs font-medium text-muted-foreground hover:text-foreground underline underline-offset-4 cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
