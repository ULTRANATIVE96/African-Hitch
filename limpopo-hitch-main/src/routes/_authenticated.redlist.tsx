import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ShieldAlert, FileText, Search, X } from "lucide-react";
import { useCurrentUser, useFlags, useAllUsers } from "@/lib/api-hooks";
import { UserAvatar } from "@/components/UserAvatar";

export const Route = createFileRoute("/_authenticated/redlist")({
  head: () => ({ meta: [{ title: "Red list" }] }),
  component: RedList,
});

const REASON_LABELS: Record<string, string> = {
  wrong_dropoff: "Dropped at wrong location",
  no_show: "No-show",
  unsafe_driving: "Unsafe driving",
  payment_issue: "Payment issue",
  other: "Other",
};

function RedList() {
  const { data: me } = useCurrentUser();
  const { data: flags = [], isLoading } = useFlags();
  const { data: users = [] } = useAllUsers();
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string, typeof flags>();
    for (const f of flags) {
      const arr = map.get(f.flaggedUserId) ?? [];
      arr.push(f);
      map.set(f.flaggedUserId, arr);
    }
    const cleanQuery = query.toLowerCase().trim();
    return Array.from(map.entries())
      .map(([uid, list]) => ({ user: users.find((u) => u.id === uid), list }))
      .filter(({ user, list }) => {
        if (!user) return false;
        if (!cleanQuery) return true;
        const reasons = list.map((fl) => REASON_LABELS[fl.reason] || fl.reason).join(" ");
        const corpus = `${user.name} ${user.role} ${reasons}`.toLowerCase();
        return corpus.includes(cleanQuery);
      })
      .sort((a, b) => b.list.length - a.list.length);
  }, [flags, users, query]);

  const myFlags = me ? flags.filter((f) => f.flaggedUserId === me.id) : [];

  if (isLoading) return <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <ShieldAlert className="h-5 w-5" />
          <h1 className="font-display text-xl font-bold">Red list</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Drivers and hikers who have been flagged by the community for broken agreements. Travel
          with extra care or avoid them.
        </p>
      </div>

      {myFlags.length > 0 && (
        <div className="rounded-2xl border border-amber-400/40 bg-amber-400/5 p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              You have {myFlags.length} flag{myFlags.length > 1 ? "s" : ""} against your account
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              If any of these are unfair, you can appeal to Dac-Technology for review.
            </p>
          </div>
          <Link
            to="/appeal"
            className="shrink-0 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition"
          >
            Appeal
          </Link>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, role, or flag reason..."
          className="w-full rounded-full border bg-card pl-10 pr-10 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
        />
        {query.trim() && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition cursor-pointer"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-3">
        {grouped.length === 0 && (
          <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
            Nobody on the red list. Good roads.
          </div>
        )}
        {grouped.map(({ user, list }) => {
          if (!user) return null;
          return (
            <div key={user.id} className="rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    user={user}
                    className="h-8 w-8 text-xl flex items-center justify-center rounded-full bg-secondary overflow-hidden object-cover"
                  />
                  <div>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {list.length >= 10 && (
                    <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white animate-pulse">
                      Banned
                    </span>
                  )}
                  <span className="rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-semibold text-destructive">
                    {list.length} flag{list.length > 1 ? "s" : ""}
                  </span>
                  {me && user.id === me.id && (
                    <Link
                      to="/appeal"
                      className="flex items-center gap-1 rounded-full border border-amber-400/50 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 text-xs font-semibold text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
                    >
                      <FileText className="h-3 w-3" />
                      Appeal
                    </Link>
                  )}
                </div>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {list.map((f) => (
                  <li key={f.id} className="rounded-lg bg-secondary p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{REASON_LABELS[f.reason] ?? f.reason}</div>
                    </div>
                    <div className="text-muted-foreground mt-0.5">{f.detail}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Reported by a {f.reporterRole} · {new Date(f.createdAt).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
