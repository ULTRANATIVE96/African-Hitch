import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Luggage,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
  X,
  Car,
  Mountain,
} from "lucide-react";
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
  "Giyani → Polokwane",
  "Makhado → Polokwane",
];

function Feed() {
  const navigate = useNavigate();
  const { data: me, isLoading: meLoading } = useCurrentUser();
  const { data: posts = [], isLoading: postsLoading } = usePostsFeed();
  const { data: users = [] } = useAllUsers();
  const { data: requests = [] } = useMyRequests();
  const { data: flags = [] } = useFlags();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "driver" | "hiker">("all");

  useEffect(() => {
    if (!meLoading && !me) {
      navigate({ to: "/auth" });
    }
  }, [meLoading, me, navigate]);

  const visible = useMemo(() => {
    if (!me) return [];
    return posts
      .filter((p) => {
        if (!p.open) return false;
        if (roleFilter === "all") return true;
        return p.role === roleFilter;
      })
      .filter((p) => {
        const trimmed = query.trim();
        if (!trimmed) return true;

        const author = users.find((u) => u.id === p.authorId) || (p as any).author;

        // Slang & abbreviation expansion
        const tokenGroups = expandSearchTokens(trimmed);
        if (tokenGroups.length === 0) return true;

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

        return tokenGroups.every((synonyms) =>
          synonyms.some((synonym) => corpus.includes(synonym))
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [posts, roleFilter, query, me?.id, users]);

  if (meLoading || postsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#14382b] border-t-transparent mx-auto" />
        <p className="text-xs font-semibold text-[#8a8170]">Loading trips...</p>
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
      {/* ─── Hero Banner with Nature/Mountain Scene ─────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0f2c22] via-[#14382b] to-[#1f4a3b] p-6 sm:p-8 text-white shadow-md">
        {/* Artistic Landscape SVG Background */}
        <div className="absolute inset-0 pointer-events-none opacity-20 select-none overflow-hidden">
          <svg className="w-full h-full object-cover" viewBox="0 0 600 240" fill="none" preserveAspectRatio="none">
            {/* Setting sun */}
            <circle cx="480" cy="80" r="50" fill="#f59e0b" opacity="0.3" />
            <circle cx="480" cy="80" r="70" fill="#f59e0b" opacity="0.15" />
            {/* Distant Mountains */}
            <path d="M120 240 L260 70 L420 240 Z" fill="#ffffff" opacity="0.15" />
            <path d="M280 240 L450 90 L580 240 Z" fill="#ffffff" opacity="0.1" />
            <path d="M-20 240 L110 110 L280 240 Z" fill="#ffffff" opacity="0.2" />
            {/* Mountain Ridge */}
            <path
              d="M0 240 C100 200 160 180 260 190 C360 200 440 170 600 210 L600 240 L0 240 Z"
              fill="#061a13"
              opacity="0.6"
            />
          </svg>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-emerald-200 backdrop-blur-xs mb-3 border border-white/10">
            <Mountain className="h-3.5 w-3.5" />
            <span>Limpopo Commute & Ride Share</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Drivers going your way
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-emerald-100/80 leading-relaxed font-normal">
            Find a driver heading to your destination and share the journey safely.
          </p>
        </div>
      </div>

      {/* ─── Search Bar ─────────────────────────────────────── */}
      <div className="relative flex items-center rounded-full bg-white border border-[#e8e4d8] shadow-xs px-4 py-1.5 transition-all focus-within:border-[#14382b] focus-within:ring-2 focus-within:ring-[#14382b]/15">
        <Search className="h-4 w-4 text-[#8a8170] shrink-0 mr-2.5" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search route (e.g. PLK → Joza, Tzaneen)"
          className="w-full bg-transparent text-sm text-[#111827] placeholder:text-[#9ca3af] outline-none py-1.5"
        />
        {query.trim() ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="flex h-7 w-7 items-center justify-center rounded-full text-[#8a8170] hover:bg-[#ede9dc] hover:text-[#111827] transition shrink-0 cursor-pointer mr-1"
            title="Clear"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {}}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#14382b] text-white hover:bg-[#1b4a3a] transition shrink-0 shadow-xs cursor-pointer ml-1"
          title="Search"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* ─── Filter Pills ───────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
        <button
          type="button"
          onClick={() => setRoleFilter("all")}
          className={`rounded-full px-4 py-2 font-semibold transition shrink-0 cursor-pointer ${
            roleFilter === "all"
              ? "bg-[#14382b] text-white shadow-xs"
              : "bg-white border border-[#e8e4d8] text-[#4b5563] hover:border-[#14382b]"
          }`}
        >
          All trips
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter("driver")}
          className={`rounded-full px-4 py-2 font-semibold transition shrink-0 cursor-pointer ${
            roleFilter === "driver"
              ? "bg-[#14382b] text-white shadow-xs"
              : "bg-white border border-[#e8e4d8] text-[#4b5563] hover:border-[#14382b]"
          }`}
        >
          Drivers only
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter("hiker")}
          className={`rounded-full px-4 py-2 font-semibold transition shrink-0 cursor-pointer ${
            roleFilter === "hiker"
              ? "bg-[#14382b] text-white shadow-xs"
              : "bg-white border border-[#e8e4d8] text-[#4b5563] hover:border-[#14382b]"
          }`}
        >
          Hikers only
        </button>
        <button
          type="button"
          onClick={() => {}}
          className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#e8e4d8] px-3.5 py-2 font-semibold text-[#4b5563] hover:border-[#14382b] transition shrink-0 cursor-pointer"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
        </button>
      </div>

      {/* ─── Popular Routes Section ─────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-[#1f2937] uppercase tracking-wider">Popular routes</h2>
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-xs font-semibold text-[#14382b] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {POPULAR_ROUTES.map((route) => {
            const active = query === route;
            return (
              <button
                key={route}
                type="button"
                onClick={() => handleRouteChipClick(route)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  active
                    ? "bg-[#14382b] text-white border-[#14382b] shadow-xs"
                    : "bg-white text-[#4b5563] border-[#e8e4d8] hover:border-[#14382b] hover:text-[#111827]"
                }`}
              >
                {route}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Trips List / Empty State ───────────────────────── */}
      {visible.length === 0 ? (
        <div className="rounded-3xl border border-[#e8e4d8] bg-white p-8 text-center space-y-3 shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ffeedb] text-[#c85a17]">
            <Mountain className="h-8 w-8" />
          </div>
          <h3 className="font-display font-bold text-lg text-[#111827]">
            {query.trim() ? "No matching trips found" : "No drivers available right now"}
          </h3>
          <p className="text-xs text-[#6b7280] max-w-sm mx-auto leading-relaxed">
            {query.trim()
              ? `No active trips matched "${query}". Check your spelling or try clearing the search filter.`
              : "Check back later or try posting your own ride request to get notified."}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            {query.trim() ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#14382b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1b4a3a] transition cursor-pointer shadow-xs"
              >
                <X className="h-3.5 w-3.5" />
                Clear search
              </button>
            ) : (
              <Link
                to="/post"
                className="inline-flex items-center gap-1.5 rounded-full bg-[#14382b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#1b4a3a] transition shadow-xs"
              >
                + Post a ride request
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {visible.map((p) => {
            const author = users.find((u) => u.id === p.authorId) || (p as any).author;
            if (!author) return null;

            const isFlagged = flags.filter((f) => f.flaggedUserId === p.authorId).length > 0;
            const isFlaggedOthers = isFlagged && p.authorId !== me.id;
            const postAccepted = requests.filter((r) => r.postId === p.id && r.status === "accepted").length;
            const totalSeats = p.seats ?? p.passengers ?? 4;
            const remainingSeats = Math.max(0, totalSeats - postAccepted);

            return (
              <Link
                key={p.id}
                to="/trip/$id"
                params={{ id: p.id }}
                className={`group block rounded-2xl border bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-[#14382b]/50 hover:shadow-md ${
                  isFlaggedOthers
                    ? "border-red-300 bg-red-50/20"
                    : "border-[#e8e4d8]"
                }`}
              >
                {/* Route Header & Price */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-base font-bold text-[#111827] flex-wrap">
                      <div className="flex items-center gap-1.5 text-[#14382b]">
                        <MapPin className="h-4 w-4 fill-[#14382b]/15" />
                        <span>{p.fromLocation}</span>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-[#8a8170] shrink-0" />
                      <span className="text-[#111827]">{p.toLocation}</span>
                    </div>
                    {p.notes && (
                      <p className="text-xs text-[#6b7280] line-clamp-1">
                        {p.notes}
                      </p>
                    )}
                  </div>

                  {/* Price Tag & Chevron */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="rounded-full bg-[#ffeedb] px-3 py-1 text-xs sm:text-sm font-bold text-[#c85a17] border border-[#fed7aa]/60">
                      R {p.pricePerSeat}
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#8a8170] group-hover:text-[#14382b] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                {/* Car Photo Preview if available */}
                {p.carPhoto && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-[#e8e4d8] max-h-36 bg-[#ede9dc]">
                    <img src={p.carPhoto} className="w-full h-36 object-cover" alt="Vehicle preview" />
                  </div>
                )}

                {/* Meta details: Date, Seats, Vehicle */}
                <div className="mt-3 pt-3 border-t border-[#f0ece1] flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#6b7280]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#8a8170]" />
                    <span>
                      {p.date} · {p.time}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#8a8170]" />
                    <span>
                      {remainingSeats} {remainingSeats === 1 ? "seat" : "seats"} available
                    </span>
                  </div>

                  {(author.vehicle || p.role === "driver") && (
                    <div className="flex items-center gap-1.5">
                      <Car className="h-3.5 w-3.5 text-[#8a8170]" />
                      <span>{author.vehicle || "Toyota Quantum Minibus"}</span>
                    </div>
                  )}

                  {p.luggage && p.luggage !== "none" && (
                    <div className="flex items-center gap-1.5">
                      <Luggage className="h-3.5 w-3.5 text-[#8a8170]" />
                      <span className="capitalize">{p.luggage} bag</span>
                    </div>
                  )}
                </div>

                {/* Author Info footer */}
                <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-[#f0ece1]/70 text-xs text-[#6b7280]">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      user={author}
                      className="h-6 w-6 text-xs flex items-center justify-center rounded-full bg-[#ede9dc] overflow-hidden object-cover select-none"
                    />
                    <span className="font-semibold text-[#374151]">{author.name}</span>
                    <span className="text-[#8a8170]">· ★ {author.rating.toFixed(1)}</span>
                  </div>
                  {isFlaggedOthers ? (
                    <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                      Flagged User
                    </span>
                  ) : p.authorId === me.id ? (
                    <span className="rounded bg-[#14382b]/10 px-2 py-0.5 text-[10px] font-bold text-[#14382b]">
                      Your Post
                    </span>
                  ) : (
                    <span className="font-semibold text-[#14382b] group-hover:underline">
                      View details →
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
