import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { ArrowRight, Calendar, Luggage, MapPin, Search, Users, X } from "lucide-react";
import { useCurrentUser, usePostsFeed, useMyRequests, useFlags, useAllUsers } from "@/lib/api-hooks";
import { UserAvatar } from "@/components/UserAvatar";
import { expandSearchTokens } from "@/lib/location-aliases";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({ meta: [{ title: "Feed — HikeConnect" }] }),
  component: Feed,
});

const POPULAR_ROUTES = [
  "Polokwane → Tzaneen",
  "Polokwane → Thohoyandou",
  "Mokopane → Polokwane",
  "Giyani",
  "Makhado",
];

function Feed() {
  const navigate = useNavigate();
  const { data: me, isLoading: meLoading } = useCurrentUser();
  const { data: posts = [], isLoading: postsLoading } = usePostsFeed();
  const { data: users = [] } = useAllUsers();
  const { data: requests = [] } = useMyRequests();
  const { data: flags = [] } = useFlags();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"suggested" | "all" | "driver" | "hiker">("suggested");

  useEffect(() => {
    if (!meLoading && !me) {
      navigate({ to: "/auth" });
    }
  }, [meLoading, me, navigate]);

  // Suggested mode: Hikers see driver trips; drivers see hiker requests
  const suggestedRole = me?.role === "hiker" ? "driver" : "hiker";
  const activeRole = roleFilter === "suggested" ? suggestedRole : roleFilter;

  const visible = useMemo(() => {
    if (!me) return [];
    return posts
      .filter((p) => {
        if (!p.open) return false;
        if (activeRole === "all") return true;
        return p.role === activeRole || p.authorId === me.id;
      })
      .filter((p) => {
        const trimmed = query.trim();
        if (!trimmed) return true;

        const author = users.find((u) => u.id === p.authorId) || (p as any).author;

        // Slang & abbreviation expansion (e.g. joza/joburg -> Johannesburg, plk -> Polokwane, pta -> Pretoria)
        const tokenGroups = expandSearchTokens(trimmed);
        if (tokenGroups.length === 0) return true;

        // Build comprehensive searchable corpus
        const corpus = [
          p.fromLocation,
          p.toLocation,
          author?.name,
          author?.vehicle,
          author?.plate,
          p.notes,
          p.luggage,
          p.date,
          p.time,
          p.role,
          `r${p.pricePerSeat}`,
          `${p.pricePerSeat}`,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        // Every token group must match at least one synonym somewhere in the post or author details
        return tokenGroups.every((synonyms) =>
          synonyms.some((synonym) => corpus.includes(synonym))
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, activeRole, query, me?.id, users]);

  if (meLoading || postsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-xs font-semibold text-muted-foreground">Loading feed...</p>
      </div>
    );
  }

  if (!me) return null;

  const handleRouteChipClick = (route: string) => {
    if (query === route) {
      setQuery("");
    } else {
      setQuery(route);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">
            {activeRole === "driver"
              ? "Drivers going your way"
              : activeRole === "hiker"
                ? "Hikers needing a ride"
                : "All active trips & requests"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {me.role === "hiker"
              ? "Send a request to a driver below, or post your own trip."
              : "Offer a ride to a hiker below, or post your trip."}
          </p>
        </div>
      </div>

      {/* Role filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setRoleFilter("suggested")}
          className={`rounded-full px-3 py-1.5 font-medium transition cursor-pointer shrink-0 ${
            roleFilter === "suggested"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          {me.role === "hiker" ? "Drivers for you" : "Hikers for you"}
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter("all")}
          className={`rounded-full px-3 py-1.5 font-medium transition cursor-pointer shrink-0 ${
            roleFilter === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          All trips
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter("driver")}
          className={`rounded-full px-3 py-1.5 font-medium transition cursor-pointer shrink-0 ${
            roleFilter === "driver"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Drivers only
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter("hiker")}
          className={`rounded-full px-3 py-1.5 font-medium transition cursor-pointer shrink-0 ${
            roleFilter === "hiker"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          Hikers only
        </button>
      </div>

      {/* Search Bar with Icon & Clear button */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search route (e.g. PLK → Joza, Tzaneen), driver, vehicle..."
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
          <Link
            to="/post"
            className="shrink-0 flex items-center justify-center gap-2 rounded-full border border-dashed border-primary/40 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition"
          >
            + Post {me.role === "hiker" ? "a ride request" : "a trip"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Quick popular route suggestion tags */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">
          <span className="text-[11px] font-semibold text-muted-foreground">Popular:</span>
          {POPULAR_ROUTES.map((route) => {
            const active = query === route;
            return (
              <button
                key={route}
                type="button"
                onClick={() => handleRouteChipClick(route)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                {route}
              </button>
            );
          })}
        </div>

        {/* Search result indicator when query is active */}
        {query.trim() && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pt-1">
            <span>
              Found <strong>{visible.length}</strong> {visible.length === 1 ? "trip" : "trips"} matching "
              <span className="text-foreground font-semibold">{query}</span>"
            </span>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-primary hover:underline font-semibold cursor-pointer"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        query.trim() ? (
          <div className="rounded-2xl border bg-card p-8 text-center space-y-3 shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-base">No trips found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              No trips matched "<strong className="text-foreground">{query}</strong>". Try searching for a different
              town, driver name, vehicle, or clearing filters.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setQuery("")}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110 transition cursor-pointer shadow-sm"
              >
                <X className="h-3.5 w-3.5" />
                Clear search
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
            Nothing here yet. Check back soon.
          </div>
        )
      ) : (
        <div className="space-y-3">
          {visible.map((p) => {
            const author = users.find((u) => u.id === p.authorId) || (p as any).author;
            if (!author) return null;

            const isFlagged = flags.filter((f) => f.flaggedUserId === p.authorId).length > 0;
            const isFlaggedOthers = isFlagged && p.authorId !== me.id;
            const postAccepted = requests.filter((r) => r.postId === p.id && r.status === "accepted").length;
            const totalSeats = p.seats ?? p.passengers ?? 1;

            return (
              <Link
                key={p.id}
                to="/trip/$id"
                params={{ id: p.id }}
                className={`block rounded-2xl border p-4 shadow-sm transition flex flex-col justify-between ${
                  isFlaggedOthers
                    ? "bg-red-500/5 border-red-500/30 hover:border-red-500/50"
                    : "bg-card hover:border-primary/40 hover:shadow-md"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={isFlaggedOthers ? "rounded-full p-0.5 ring-2 ring-red-500/40" : ""}>
                        <UserAvatar
                          user={author}
                          className="h-10 w-10 text-2xl flex items-center justify-center rounded-full bg-secondary overflow-hidden object-cover select-none"
                        />
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-1.5 flex-wrap text-sm">
                          {author.name}
                          {isFlaggedOthers && (
                            <span className="inline-flex items-center rounded bg-red-600/10 px-1.5 py-0.5 text-[9px] font-bold text-red-600 uppercase tracking-wider whitespace-nowrap">
                              ⚠️ Flagged User
                            </span>
                          )}
                          {p.authorId === me.id && (
                            <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary uppercase tracking-wider whitespace-nowrap">
                              Your Post
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ⭐ {author.rating.toFixed(1)} · {author.completedRides} rides
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-xl font-bold text-primary">R{p.pricePerSeat}</div>
                      <div className="text-[10px] uppercase font-semibold text-muted-foreground">per seat</div>
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">{p.fromLocation}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground">{p.toLocation}</span>
                  </div>

                  {p.carPhoto && (
                    <div className="mt-3 overflow-hidden rounded-xl border max-h-40 bg-muted">
                      <img src={p.carPhoto} className="w-full h-40 object-cover" alt="Car photo" />
                    </div>
                  )}
                </div>

                <div className="mt-3.5 pt-2.5 border-t flex flex-wrap gap-2 text-xs">
                  <Chip icon={<Calendar className="h-3 w-3" />}>
                    {p.date} · {p.time}
                  </Chip>
                  {p.seats != null && (
                    <Chip icon={<Users className="h-3 w-3" />}>
                      <span className={postAccepted > 0 ? "text-amber-600 font-bold" : ""}>
                        {postAccepted}/{totalSeats} filled
                      </span>
                    </Chip>
                  )}
                  {p.passengers != null && (
                    <Chip icon={<Users className="h-3 w-3" />}>
                      {p.passengers} passenger{p.passengers > 1 ? "s" : ""}
                    </Chip>
                  )}
                  {p.luggage && p.luggage !== "none" && (
                    <Chip icon={<Luggage className="h-3 w-3" />}>{p.luggage} luggage</Chip>
                  )}
                  {author.plate && <Chip>{author.plate}</Chip>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground font-medium">
      {icon}
      {children}
    </span>
  );
}
