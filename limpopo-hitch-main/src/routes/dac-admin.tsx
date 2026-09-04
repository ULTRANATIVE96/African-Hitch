import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Shield,
  Users,
  Flag,
  FileText,
  LogOut,
  Ban,
  CheckCircle,
  Trash2,
  Eye,
  Search,
  BarChart3,
  AlertTriangle,
  X,
  Navigation,
  MapPin,
} from "lucide-react";
import type { ApiUser } from "@/lib/api-hooks";
import { useAllUsers, useFlags, usePostsFeed, useMyRequests } from "@/lib/api-hooks";

// ─── Credentials ─────────────────────────────────────────────────────────────
const ADMIN_USERNAME = "dac-admin";
const ADMIN_PASSWORD = "DACtech2025!";
const ADMIN_SESSION_KEY = "dac_admin_session";

export const Route = createFileRoute("/dac-admin")({
  head: () => ({
    meta: [{ title: "DAC-Tech Admin Portal" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: DacAdminPage,
});

type AdminTab = "stats" | "users" | "flags" | "appeals" | "tracking";

function DacAdminPage() {
  const [loggedIn, setLoggedIn] = useState(() => {
    if (typeof window === "undefined") return false;
    // Uses sessionStorage so session expires automatically on closing tab/browser
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
  });

  const handleLogin = () => setLoggedIn(true);
  const handleLogout = () => {
    if (typeof window !== "undefined") sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setLoggedIn(false);
  };

  if (!loggedIn) return <AdminLogin onLogin={handleLogin} />;
  return <AdminDashboard onLogout={handleLogout} />;
}

// ════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ════════════════════════════════════════════════════════════════════════════
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      if (typeof window !== "undefined") sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      onLogin();
    } else {
      setError("Invalid credentials. Access denied.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 40%, #0d1b2a 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">DAC-Tech Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Limpopo Hike Connect Management</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-700/50 p-6 space-y-4 shadow-2xl"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Admin Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="dac-admin"
              required
              className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Authenticating..." : "Sign into Admin Portal"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] text-slate-600">
          Session expires automatically upon closing tab/browser.
        </p>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("stats");

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "stats", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "users", label: "Users & Bans", icon: <Users className="h-4 w-4" /> },
    { id: "tracking", label: "Live GPS Tracking", icon: <Navigation className="h-4 w-4" /> },
    { id: "flags", label: "Flags", icon: <Flag className="h-4 w-4" /> },
    { id: "appeals", label: "Appeals", icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 40%, #0d1b2a 100%)" }}
    >
      {/* Top bar */}
      <header
        className="border-b border-slate-700/50 sticky top-0 z-20"
        style={{ background: "rgba(15,15,26,0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="mx-auto max-w-6xl px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-sm">DAC-Tech Admin</span>
              <div className="text-[10px] text-slate-500">Session Security Active</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>

        {/* Tab nav */}
        <div className="mx-auto max-w-6xl px-4 flex gap-1 pb-0 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition shrink-0 cursor-pointer ${
                activeTab === t.id
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {activeTab === "stats" && <StatsTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "tracking" && <TrackingTab />}
        {activeTab === "flags" && <FlagsTab />}
        {activeTab === "appeals" && <AppealsTab />}
      </main>

      <footer className="border-t border-slate-700/30 py-4 mt-8">
        <p className="text-center text-[11px] text-slate-600">
          © {new Date().getFullYear()} Dac-Technology · dac-technologies.co.za · Admin Portal v1.2
        </p>
      </footer>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STATS TAB
// ════════════════════════════════════════════════════════════════════════════
function StatsTab() {
  const { data: users = [] } = useAllUsers();
  const { data: flags = [] } = useFlags();
  const { data: posts = [] } = usePostsFeed();

  // Appeals count is not available without a dedicated hook; show 0
  const pendingAppealsCount = 0;

  const stats = [
    {
      label: "Total Users",
      value: users.length,
      color: "from-violet-600 to-indigo-600",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "Banned Users",
      value: users.filter((u) => u.banned).length,
      color: "from-red-600 to-rose-600",
      icon: <Ban className="h-5 w-5" />,
    },
    {
      label: "Total Flags",
      value: flags.length,
      color: "from-amber-500 to-orange-500",
      icon: <Flag className="h-5 w-5" />,
    },
    {
      label: "Pending Appeals",
      value: pendingAppealsCount,
      color: "from-sky-500 to-cyan-500",
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-lg font-bold mb-1">Overview</h2>
        <p className="text-slate-500 text-xs">Platform summary for Limpopo Hike Connect</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-700/50 p-5 space-y-3"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white`}
            >
              {s.icon}
            </div>
            <div>
              <div className="text-3xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-2xl border border-slate-700/50 p-5 space-y-3"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <h3 className="text-white font-semibold text-sm">Recent Activity</h3>
        <div className="space-y-2">
          <div className="text-xs text-slate-400">
            <span className="font-semibold text-white">{posts.filter((p) => p.open).length}</span>{" "}
            active trips posted
          </div>
          <div className="text-xs text-slate-400">
            <span className="font-semibold text-white">
              {users.filter((u) => u.role === "driver").length}
            </span>{" "}
            registered drivers
          </div>
          <div className="text-xs text-slate-400">
            <span className="font-semibold text-white">
              {users.filter((u) => u.role === "hiker").length}
            </span>{" "}
            registered hikers/riders
          </div>
          <div className="text-xs text-slate-400">
            <span className="font-semibold text-amber-400">
              {pendingAppealsCount}
            </span>{" "}
            appeals awaiting review
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// USERS TAB (WITH TIMED BANS)
// ════════════════════════════════════════════════════════════════════════════
function UsersTab() {
  const { data: users = [] } = useAllUsers();
  const { data: flags = [] } = useFlags();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "banned" | "driver" | "hiker">("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Timed ban modal state — admin actions via API not yet implemented; show UI only
  const [banModalUser, setBanModalUser] = useState<ApiUser | null>(null);
  const [banDuration, setBanDuration] = useState<number | "permanent">(24);
  const [banReason, setBanReason] = useState("");

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const matchQ =
          !query ||
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.googleEmail?.toLowerCase().includes(query.toLowerCase());
        const matchF = filter === "all" || (filter === "banned" ? u.banned : u.role === filter);
        return matchQ && matchF;
      }),
    [users, query, filter],
  );

  const handleApplyBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banModalUser) return;
    // Note: ban via API not yet implemented
    alert(`Ban action logged for ${banModalUser.name} (${banDuration}h). Implement via API.`);
    setBanModalUser(null);
    setBanReason("");
  };

  const formatBanRemaining = (bannedUntil?: number) => {
    if (!bannedUntil) return "Permanent";
    const remainingMs = bannedUntil - Date.now();
    if (remainingMs <= 0) return "Expiring...";
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h2 className="text-white text-lg font-bold">User Management & Timed Bans</h2>
          <p className="text-slate-500 text-xs">
            {filtered.length} of {users.length} users listed
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "banned", "driver", "hiker"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                filter === f
                  ? "bg-violet-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-xl border border-slate-700/50 bg-slate-800/60 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500"
        />
      </div>

      {/* Users List */}
      <div className="space-y-2">
        {filtered.map((u) => {
          const userFlagCount = flags.filter((f) => f.flaggedUserId === u.id).length;
          return (
            <div
              key={u.id}
              className="rounded-2xl border border-slate-700/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-lg shrink-0">
                  {u.avatar}
                </div>
                <div className="min-w-0">
                  <div className="text-white font-semibold text-sm truncate flex items-center gap-2">
                    {u.name}
                    {u.banned && (
                      <span className="rounded-full bg-red-500/20 text-red-400 px-2 py-0.5 text-[10px] font-bold border border-red-500/30">
                        Banned
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-xs">{u.googleEmail || u.id}</div>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300 font-medium capitalize">
                      {u.role}
                    </span>
                    {userFlagCount > 0 && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-400 font-medium">
                        {userFlagCount} flag{userFlagCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {u.banned ? (
                  <button
                    onClick={() => alert("Unban via API not yet implemented. Contact dev team.")}
                    className="flex items-center gap-1 rounded-lg bg-green-500/15 border border-green-500/30 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/25 transition cursor-pointer"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Unban Account
                  </button>
                ) : (
                  <button
                    onClick={() => setBanModalUser(u)}
                    className="flex items-center gap-1 rounded-lg bg-red-500/15 border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/25 transition cursor-pointer"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Ban Account
                  </button>
                )}

                {confirmDelete === u.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        alert("User deletion via API not yet implemented.");
                        setConfirmDelete(null);
                      }}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-600 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(u.id)}
                    title="Delete user"
                    className="p-2 text-slate-500 hover:text-red-400 transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Timed Ban Modal */}
      {banModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-400" /> Ban User: {banModalUser.name}
              </h3>
              <button
                onClick={() => setBanModalUser(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleApplyBan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Select Ban Duration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "24 Hours", value: 24 },
                    { label: "7 Days", value: 24 * 7 },
                    { label: "30 Days", value: 24 * 30 },
                    { label: "Permanent", value: "permanent" as const },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={String(opt.value)}
                      onClick={() => setBanDuration(opt.value)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
                        banDuration === opt.value
                          ? "border-red-500 bg-red-500/20 text-white"
                          : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-750"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Reason for Ban (Optional)
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g. Repeated no-shows or unsafe driving reports"
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBanModalUser(null)}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-red-600 px-5 py-2 text-xs font-semibold text-white hover:bg-red-700 transition"
                >
                  Apply Ban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// TRIP PICKUP & DROP-OFF MONITORING TAB (Admin)
// ════════════════════════════════════════════════════════════════════════════
function TrackingTab() {
  const { data: requestsRaw = [] } = useMyRequests();
  const { data: posts = [] } = usePostsFeed();
  const { data: users = [] } = useAllUsers();
  const requests = requestsRaw as any[];

  const [statusFilter, setStatusFilter] = useState<"all" | "accepted" | "completed" | "pending">("all");
  const [searchQ, setSearchQ] = useState("");

  const filtered = requests
    .filter((r) => statusFilter === "all" || r.status === statusFilter)
    .filter((r) => {
      if (!searchQ) return true;
      const post = posts.find((p) => p.id === r.postId);
      const driver = post ? users.find((u) => u.id === post.authorId) : null;
      const hiker = users.find((u) => u.id === r.fromUserId);
      const q = searchQ.toLowerCase();
      return (
        post?.fromLocation?.toLowerCase().includes(q) ||
        post?.toLocation?.toLowerCase().includes(q) ||
        driver?.name.toLowerCase().includes(q) ||
        hiker?.name.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-lg font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-violet-400" /> Pickup &amp; Drop-off Oversight
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Monitor every trip's intended route vs. confirmed drop-off GPS coordinates to detect driver misconduct.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search driver, hiker, route..."
            className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "accepted", "completed", "pending"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition cursor-pointer capitalize ${
                statusFilter === s ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Trips", value: requests.length, color: "text-violet-400" },
          { label: "Active", value: requests.filter((r) => r.status === "accepted").length, color: "text-emerald-400" },
          { label: "Completed", value: requests.filter((r) => r.status === "completed").length, color: "text-sky-400" },
          {
            label: "Drop-off Confirmed",
            value: requests.filter((r) => r.dropoffConfirmedByDriver && r.dropoffConfirmedByHiker).length,
            color: "text-green-400",
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-slate-700/40 bg-slate-800/50 p-3 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Trip rows */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-slate-700/40 p-10 text-center text-slate-500 text-sm">
            No trips match your filters.
          </div>
        )}
        {filtered.map((req) => {
          const post = posts.find((p) => p.id === req.postId);
          const driver = post ? users.find((u) => u.id === post.authorId) : null;
          const hiker = users.find((u) => u.id === req.fromUserId);

          const hasDropoffGPS = req.dropoffLat != null && req.dropoffLng != null;
          const driverConfirmed = req.dropoffConfirmedByDriver;
          const hikerConfirmed = req.dropoffConfirmedByHiker;
          const bothConfirmed = driverConfirmed && hikerConfirmed;
          const disagreement = !bothConfirmed && req.status === "completed";

          return (
            <div
              key={req.id}
              className={`rounded-2xl border p-4 space-y-3 ${
                disagreement
                  ? "border-red-500/40 bg-red-500/5"
                  : bothConfirmed
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-slate-700/40 bg-slate-800/30"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-white font-semibold text-sm">
                    {post?.fromLocation ?? "—"} → {post?.toLocation ?? "—"}
                  </div>
                  <div className="text-slate-400 text-xs mt-0.5">
                    {post?.date} {post?.time} · R{post?.pricePerSeat}/seat
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full text-[10px] font-bold px-2.5 py-0.5 uppercase ${
                      req.status === "completed"
                        ? "bg-sky-500/20 text-sky-400"
                        : req.status === "accepted"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-slate-600/30 text-slate-400"
                    }`}
                  >
                    {req.status}
                  </span>
                  {disagreement && (
                    <span className="rounded-full text-[10px] font-bold px-2 py-0.5 bg-red-500/20 text-red-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Unconfirmed
                    </span>
                  )}
                </div>
              </div>

              {/* Participants */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-slate-700/30 p-2.5 space-y-1">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">🚗 Driver</div>
                  <div className="text-white font-medium">{driver?.name ?? "Unknown"}</div>
                  <div className="text-slate-400">{driver?.vehicle ?? "No vehicle"} · {driver?.plate ?? "—"}</div>
                  <div
                    className={`text-[10px] font-bold ${driverConfirmed ? "text-emerald-400" : "text-amber-400"}`}
                  >
                    {driverConfirmed ? "✅ Drop-off Confirmed" : "⏳ Awaiting Confirmation"}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-700/30 p-2.5 space-y-1">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">🎒 Hiker</div>
                  <div className="text-white font-medium">{hiker?.name ?? "Unknown"}</div>
                  <div className="text-slate-400">Requested: {new Date(req.createdAt).toLocaleDateString()}</div>
                  <div
                    className={`text-[10px] font-bold ${hikerConfirmed ? "text-emerald-400" : "text-amber-400"}`}
                  >
                    {hikerConfirmed ? "✅ Drop-off Confirmed" : "⏳ Awaiting Confirmation"}
                  </div>
                </div>
              </div>

              {/* GPS Points */}
              <div className="border-t border-slate-700/40 pt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="space-y-0.5">
                  <div className="text-slate-500 uppercase text-[10px] font-bold">📍 Pickup Point</div>
                  <div className="text-slate-200">{req.pickupPoint ?? post?.fromLocation ?? "Not recorded"}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-slate-500 uppercase text-[10px] font-bold">🏁 Intended Drop-off</div>
                  <div className="text-slate-200">{(req as any).dropoffName ?? post?.toLocation ?? "Not recorded"}</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-slate-500 uppercase text-[10px] font-bold">📡 GPS Drop-off Coords</div>
                  {hasDropoffGPS ? (
                    <div className="text-emerald-400 font-mono">
                      {req.dropoffLat!.toFixed(5)}, {req.dropoffLng!.toFixed(5)}
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">No GPS data yet</div>
                  )}
                </div>
              </div>

              {/* Driver live GPS */}
              {(req.driverLat != null || req.hikerLat != null) && (
                <div className="border-t border-slate-700/40 pt-3 grid grid-cols-2 gap-2 text-xs">
                  {req.driverLat != null && (
                    <div>
                      <div className="text-slate-500 uppercase text-[10px] font-bold mb-0.5">🚗 Driver GPS</div>
                      <div className="font-mono text-violet-300 text-[11px]">
                        {req.driverLat.toFixed(5)}, {req.driverLng?.toFixed(5)}
                      </div>
                    </div>
                  )}
                  {req.hikerLat != null && (
                    <div>
                      <div className="text-slate-500 uppercase text-[10px] font-bold mb-0.5">🎒 Hiker GPS</div>
                      <div className="font-mono text-sky-300 text-[11px]">
                        {req.hikerLat.toFixed(5)}, {req.hikerLng?.toFixed(5)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FLAGS TAB
// ════════════════════════════════════════════════════════════════════════════
function FlagsTab() {
  const { data: flags = [] } = useFlags();
  const { data: users = [] } = useAllUsers();
  // removeFlag via API not yet implemented; show note to admin

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-white text-lg font-bold">Community Red List Flags</h2>
        <p className="text-slate-500 text-xs">{flags.length} total flags recorded</p>
      </div>

      <div className="space-y-2">
        {flags.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">No flags recorded yet.</div>
        )}
        {flags.map((f) => {
          const flaggedUser = users.find((u) => u.id === f.flaggedUserId);
          const reporter = users.find((u) => u.id === f.reporterId);
          return (
            <div
              key={f.id}
              className="rounded-2xl border border-slate-700/40 p-4 space-y-2"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-white">
                  Flagged: <span className="text-red-400">{flaggedUser?.name ?? f.flaggedUserId}</span>
                </div>
                <button
                  onClick={() => alert("Flag removal requires API support. Contact dev team.")}
                  className="text-xs font-semibold text-slate-400 hover:text-red-400 transition cursor-pointer">
                  Dismiss Flag
                </button>
              </div>
              <div className="text-xs text-slate-400">{f.detail}</div>
              <div className="text-[10px] text-slate-500">
                Reporter: {reporter?.name ?? f.reporterId} · {new Date(f.createdAt).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// APPEALS TAB
// ════════════════════════════════════════════════════════════════════════════
function AppealsTab() {
  const { data: users = [] } = useAllUsers();
  // Appeals via API not yet implemented; show placeholder
  const appeals: any[] = [];
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const filtered = appeals.filter((a) => filter === "all" || a.status === filter);

  const statusBadge = (status: string) => {
    if (status === "pending") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    if (status === "approved") return "bg-green-500/15 text-green-400 border-green-500/30";
    return "bg-slate-600/30 text-slate-400 border-slate-600/30";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white text-lg font-bold">Unfair Flag Appeals</h2>
          <p className="text-slate-500 text-xs">
            {appeals.filter((a) => a.status === "pending").length} pending · {appeals.length} total
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                filter === f
                  ? "bg-violet-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            No appeals {filter !== "all" ? `with status "${filter}"` : ""}.
          </div>
        )}
        {filtered.map((a) => {
          const appealUser = users.find((u) => u.id === a.userId);
          const isExpanded = expanded === a.id;
          return (
            <div
              key={a.id}
              className="rounded-2xl border border-slate-700/40"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <div className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-violet-500/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-semibold text-sm truncate">{a.name}</div>
                    <div className="text-slate-500 text-xs">{a.email}</div>
                    {appealUser && (
                      <div className="text-slate-600 text-[10px]">User: {appealUser.name}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusBadge(a.status)}`}
                  >
                    {a.status}
                  </span>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : a.id)}
                    className="flex items-center gap-1 rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-700 transition cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {isExpanded ? "▲" : "▼"}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this appeal record?")) {
                        alert("Appeal deletion via API not yet implemented.");
                      }
                    }}
                    title="Delete appeal record"
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-slate-700/40 px-4 pb-4 pt-3 space-y-2">
                  <div className="text-xs text-slate-400 leading-relaxed">
                    <span className="font-semibold text-slate-300">Appeal reason:</span> {a.reason}
                  </div>
                  {a.feedback && (
                    <div className="text-xs text-slate-400 mt-2 p-2 rounded bg-slate-800/50 border border-slate-700/50">
                      <span className="font-semibold text-slate-300 block mb-1">Feedback:</span> {a.feedback}
                    </div>
                  )}
                  {a.status === "pending" && (
                    <div className="pt-3 mt-3 border-t border-slate-700/30 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <input
                        type="text"
                        placeholder="Feedback message to the user"
                        value={feedback[a.id] || ""}
                        onChange={(e) => setFeedback({ ...feedback, [a.id]: e.target.value })}
                        className="flex-1 rounded-lg border border-slate-700/50 bg-slate-800/60 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500"
                      />
                      <button
                        onClick={() => {
                          if (!feedback[a.id]?.trim()) {
                            alert("Please provide a feedback message for the user.");
                            return;
                          }
                          alert("Appeal approval via API not yet implemented.");
                        }}
                        className="flex items-center justify-center gap-1 rounded-lg bg-green-500/15 border border-green-500/30 px-4 py-2 text-xs font-semibold text-green-400 hover:bg-green-500/25 transition cursor-pointer"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          if (!feedback[a.id]?.trim()) {
                            alert("Please provide a feedback message for the user.");
                            return;
                          }
                          alert("Appeal rejection via API not yet implemented.");
                        }}
                        className="flex items-center justify-center gap-1 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition cursor-pointer"
                      >
                        <Ban className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
