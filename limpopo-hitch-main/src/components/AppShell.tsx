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
  Bell,
} from "lucide-react";
import { useCurrentUser } from "@/lib/api-hooks";
import { clearSession } from "@/lib/api-client";
import { UserAvatar } from "./UserAvatar";

const TABS = [
  { to: "/feed", label: "FEED", icon: Compass },
  { to: "/post", label: "POST", icon: PlusCircle },
  { to: "/requests", label: "REQUESTS", icon: Inbox },
  { to: "/redlist", label: "RED LIST", icon: ShieldAlert },
  { to: "/payments", label: "PAY", icon: Wallet },
  { to: "/profile", label: "PROFILE", icon: UserIcon },
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
    <div className="min-h-screen bg-[#fcfbf7] text-[#1f2937]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-[#e8e4d8] bg-[#fcfbf7]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/feed" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#14382b] text-[#fcfbf7] shadow-sm">
              <Mountain className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-[#14382b]">
              HikeConnect
            </span>
          </Link>
          {user && (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2 hover:opacity-90 transition">
                <span className="hidden text-xs font-semibold text-[#374151] sm:inline">{user.name}</span>
                <span className="rounded-full bg-[#ffeedb] px-2.5 py-0.5 text-[11px] font-bold text-[#c85a17] border border-[#fed7aa]/60 capitalize">
                  {user.role}
                </span>
                <div className="ring-2 ring-[#14382b]/15 rounded-full">
                  <UserAvatar
                    user={user}
                    className="h-7 w-7 text-sm flex items-center justify-center rounded-full bg-[#e8e4d8] overflow-hidden object-cover"
                  />
                </div>
              </Link>
              <Link
                to="/requests"
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-[#4b5563] hover:bg-[#ede9dc] transition"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#ea580c] ring-2 ring-[#fcfbf7]" />
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-28 pt-4">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#e8e4d8] bg-[#ffffff]/95 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <div className="mx-auto flex max-w-2xl items-stretch justify-between px-1">
          {TABS.map(({ to, label, icon: Icon }) => {
            const active = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-1 flex-col items-center justify-center pt-2.5 pb-2 text-[10px] font-bold tracking-wider transition-all ${
                  active ? "text-[#14382b]" : "text-[#8a8170] hover:text-[#14382b]"
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform ${active ? "scale-105 stroke-[2.3]" : "stroke-[1.8]"}`} />
                <span className="mt-1">{label}</span>
                {active ? (
                  <span className="mt-1 h-0.5 w-6 rounded-full bg-[#14382b] transition-all" />
                ) : (
                  <span className="mt-1 h-0.5 w-6 rounded-full bg-transparent" />
                )}
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
