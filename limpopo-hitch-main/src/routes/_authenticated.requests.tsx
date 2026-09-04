import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useCurrentUser, useMyRequests, useAllUsers, type ApiRequest } from "@/lib/api-hooks";
import { UserAvatar } from "@/components/UserAvatar";
import { StatusChip } from "@/components/StatusChip";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({ meta: [{ title: "Requests" }] }),
  component: RequestsPage,
});

function RequestsPage() {
  const { data: me, isLoading } = useCurrentUser();
  const { data: requests = [] } = useMyRequests();
  const { data: users = [] } = useAllUsers();
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");

  const filtered = useMemo(
    () => {
      if (!me) return [];
      return (requests as any[])
        .filter((r) => (tab === "incoming" ? r.toUserId === me.id : r.fromUserId === me.id))
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    [requests, tab, me?.id],
  );

  if (isLoading) return <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!me) return null;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Your requests</h1>

      <div className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1 text-sm font-medium">
        {(["incoming", "outgoing"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full py-2 capitalize ${tab === t ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
            No {tab} requests yet.
          </div>
        )}
        {filtered.map((r: any) => {
          const post = r.post;
          const other = tab === "incoming" ? r.fromUser : r.toUser;
          if (!post || !other) return null;
          return (
            <Link
              key={r.id}
              to="/trip/$id"
              params={{ id: post.id }}
              className="block rounded-2xl border bg-card p-4 shadow-sm hover:border-primary/40"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    user={other}
                    className="h-8 w-8 text-xl flex items-center justify-center rounded-full bg-secondary overflow-hidden object-cover"
                  />
                  <div>
                    <div className="font-semibold">{other.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {post.fromLocation} <ArrowRight className="inline h-3 w-3" /> {post.toLocation} · {post.date}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusChip status={r.status} requestId={r.id} />
                  <span className="text-sm font-semibold">R{post.pricePerSeat}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
