import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Check, X, ShieldAlert, MapPin, Navigation, MessageCircle, Star, Send, Trash2 } from "lucide-react";
import {
  useCurrentUser, usePost, useAllUsers, useMyRequests,
  useFlags, useSendRequest, useUpdateRequest, useClosePost,
  useDeletePost, useAddFlag, useAddPayment, useAddComment,
  useDeleteComment, useAddReview, type ApiComment,
} from "@/lib/api-hooks";
import { UserAvatar } from "@/components/UserAvatar";
import { MapTilerMap } from "@/components/MapTilerMap";
import { StatusChip } from "@/components/StatusChip";
import { RealTimeTripTracker } from "@/components/RealTimeTripTracker";

export const Route = createFileRoute("/_authenticated/trip/$id")({
  head: () => ({ meta: [{ title: "Trip details" }] }),
  component: TripDetail,
});

const PICKUPS = [
  "Town taxi rank",
  "BP Garage on N1",
  "Shoprite parking",
  "Indian Centre rank",
  "Bus stop near clinic",
];

function TripDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: me } = useCurrentUser();
  const { data: postData, isLoading: postLoading } = usePost(id);
  const { data: users = [] } = useAllUsers();
  const { data: requests = [] } = useMyRequests();
  const { data: flags = [] } = useFlags();

  const sendRequest = useSendRequest();
  const updateRequest = useUpdateRequest();
  const closePost = useClosePost();
  const deletePost = useDeletePost();
  const addFlag = useAddFlag();
  const addPayment = useAddPayment();
  const addCommentMut = useAddComment();
  const deleteCommentMut = useDeleteComment();
  const addReview = useAddReview();

  const post = postData;
  const comments: ApiComment[] = (postData as any)?.comments ?? [];

  const [commentText, setCommentText] = useState("");
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [pickupType, setPickupType] = useState<"live" | "custom">("live");

  const [customPickup, setCustomPickup] = useState("");
  const [liveLocationStr, setLiveLocationStr] = useState("Polokwane (Estimated Live Location)");
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [flagOpen, setFlagOpen] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const hasLocatedRef = useRef(false);

  const detectLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      setLiveLocationStr("Polokwane Central (Estimated Live Location)");
      return;
    }
    setIsLocating(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          if (!response.ok) throw new Error("Network response was not ok");
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          const parts = address.split(",");
          const shortAddress = parts
            .slice(0, 3)
            .map((p: string) => p.trim())
            .join(", ");
          setLiveLocationStr(`Live: ${shortAddress}`);
        } catch (e) {
          console.error("OSM Nominatim error:", e);
          setLiveLocationStr(`Live: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError("Permission denied or location unavailable.");
        setLiveLocationStr("Polokwane Central (Estimated Live Location)");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  useEffect(() => {
    if (!me) return;
    const isMine = post?.authorId === me.id;
    if (!isMine && post?.open && pickupType === "live" && !hasLocatedRef.current) {
      hasLocatedRef.current = true;
      detectLiveLocation();
    }
  }, [post?.id, me?.id]);

  if (!me || postLoading) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Loading trip details...
      </div>
    );
  }

  if (!post) return <div>Trip not found</div>;
  const author = users.find((u) => u.id === post.authorId);
  if (!author) return <div className="p-8 text-center text-sm text-muted-foreground">User not found or deleted.</div>;
  
  const isMine = post.authorId === me.id;
  const isAuthorFlagged = flags.filter((f) => f.flaggedUserId === author.id).length > 0;
  const isAuthorFlaggedOthers = isAuthorFlagged && author.id !== me.id;

  const currentPickupSelection = pickupType === "live" ? liveLocationStr : customPickup;

  const myRequest = (requests as any[]).find((r) => r.postId === post.id && r.fromUserId === me.id);
  const incoming = (requests as any[]).filter((r) => r.postId === post.id);
  const acceptedRequests = (requests as any[]).filter((r) => r.postId === post.id && r.status === "accepted");
  const acceptedCount = acceptedRequests.length;
  const totalSeats = post.seats ?? post.passengers ?? 1;

  const activeAcceptedRequest = (requests as any[]).find(
    (r) => r.postId === post.id && (r.status === "accepted" || r.status === "completed")
  );
  const trackerDriver = activeAcceptedRequest ? users.find((u) => u.id === post.authorId) : null;
  const trackerHiker = activeAcceptedRequest ? users.find((u) => u.id === activeAcceptedRequest.fromUserId) : null;

  // Rating logic
  const myCompletedRequest = (requests as any[]).find(
    (r) => r.postId === post.id && r.fromUserId === me.id && r.status === "completed"
  );
  const myAcceptedHikerRequest = isMine
    ? (requests as any[]).find((r) => r.postId === post.id && r.status === "completed")
    : null;
  const targetForRating = isMine
    ? (myAcceptedHikerRequest ? users.find((u) => u.id === myAcceptedHikerRequest.fromUserId) : null)
    : author;
  const rideIsComplete = myCompletedRequest != null || (isMine && myAcceptedHikerRequest != null);
  const alreadyRated = false; // handled server-side

  // ── Handlers using API mutations ──────────────────────────────────────────

  const handleSendRequest = async () => {
    const selectedPickup = pickupType === "live" ? liveLocationStr : customPickup;
    if (pickupType === "custom" && !customPickup.trim()) {
      alert("Please enter a custom pickup location");
      return;
    }
    setIsSendingRequest(true);
    try {
      const res = await sendRequest.mutateAsync(post.id);
      // Update the newly created request with the pickup point
      const newRequestId = (res as any)?.data?.id;
      if (newRequestId) {
        await updateRequest.mutateAsync({ id: newRequestId, status: "pending", pickupPoint: selectedPickup });
      }
      navigate({ to: "/requests" });
    } catch (err) {
      console.error("Failed to send request:", err);
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleRecordPayment = () => {
    addPayment.mutate({
      postId: post.id,
      toUserId: post.authorId,
      amount: post.pricePerSeat,
      route: `${post.fromLocation} → ${post.toLocation}`,
    });
    updateRequest.mutate({ id: myRequest.id, status: "completed" });
  };

  const handleCancelRide = () => {
    if (window.confirm("Cancel your accepted ride? The driver's seat will reopen.")) {
      updateRequest.mutate({ id: myRequest.id, status: "rejected" });
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    updateRequest.mutate({ id: requestId, status: "accepted" });
  };

  const handleRejectRequest = (requestId: string) => {
    updateRequest.mutate({ id: requestId, status: "rejected" });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMut.mutate({ postId: post.id, text: commentText.trim() });
    setCommentText("");
  };

  const handleDeleteComment = (commentId: string) => {
    deleteCommentMut.mutate({ commentId, postId: post.id });
  };

  const handleClosePost = () => {
    closePost.mutate({ id: post.id, reason: me.role === "driver" ? "full_booked" : "ride_found" });
    navigate({ to: "/feed" });
  };

  const handleDeletePost = () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deletePost.mutate(post.id);
      navigate({ to: "/feed" });
    }
  };

  return (
    <div className="space-y-5">
      <button
        onClick={() => navigate({ to: "/feed" })}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div
        className={`rounded-2xl border p-5 shadow-sm transition-all ${
          isAuthorFlaggedOthers
            ? "bg-red-500/5 border-red-500/30 text-red-950 dark:text-red-100"
            : "bg-card border-border"
        }`}
      >
        {isAuthorFlaggedOthers && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-600/10 p-3 text-xs text-red-700 dark:text-red-200">
            <ShieldAlert className="h-4 w-4 shrink-0 text-red-600" />
            <div>
              <span className="font-semibold">⚠️ Safety Warning:</span> This driver has been flagged
              by multiple community members. Proceed with caution.
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={isAuthorFlaggedOthers ? "rounded-full p-0.5 ring-2 ring-red-500/40" : ""}
            >
              <UserAvatar
                user={author}
                className="h-10 w-10 text-2xl flex items-center justify-center rounded-full bg-secondary overflow-hidden object-cover"
              />
            </div>
            <div>
              <div className="font-semibold flex items-center gap-1.5">
                {author.name}
                {isAuthorFlaggedOthers && (
                  <span className="inline-flex items-center rounded bg-red-600/10 px-1.5 py-0.5 text-[9px] font-bold text-red-600 uppercase tracking-wider">
                    ⚠️ Flagged User
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                ⭐ {author.rating.toFixed(1)} · {author.completedRides} rides · {author.role}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-bold text-primary">R{post.pricePerSeat}</div>
            <div className="text-[10px] uppercase text-muted-foreground">per seat</div>
          </div>
        </div>

        {author.role === "driver" && author.vehicle && (
          <div className="mt-4 rounded-xl bg-secondary p-3 text-sm">
            <div className="font-medium">
              {author.vehiclePhoto} {author.vehicle}
            </div>
            <div className="text-xs text-muted-foreground">Plate: {author.plate}</div>
            {post.carPhoto && (
              <div className="mt-3 overflow-hidden rounded-xl border bg-muted">
                <img
                  src={post.carPhoto}
                  className="w-full h-auto object-cover max-h-60"
                  alt="Driver's car"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {activeAcceptedRequest && trackerDriver && trackerHiker ? (
        <RealTimeTripTracker
          request={activeAcceptedRequest}
          post={post}
          driver={trackerDriver}
          hiker={trackerHiker}
          currentUserRole={me.role}
        />
      ) : (
        <MapTilerMap
          from={post.fromLocation}
          to={post.toLocation}
          pickup={myRequest?.pickupPoint ?? (isMine ? undefined : currentPickupSelection)}
        />
      )}

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Trip details</h2>
          {post.role === "driver" && (
            <span className={`rounded-full text-xs font-bold px-3 py-1 ${
              post.open
                ? acceptedCount > 0
                  ? "bg-amber-500/15 text-amber-600"
                  : "bg-emerald-500/15 text-emerald-600"
                : "bg-red-500/15 text-red-600"
            }`}>
              {post.open
                ? `${acceptedCount}/${totalSeats} seats filled`
                : acceptedCount >= totalSeats
                  ? "Fully Booked"
                  : "Closed"}
            </span>
          )}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <Detail k="Date" v={`${post.date} · ${post.time}`} />
          {post.seats != null && <Detail k="Seats" v={String(post.seats)} />}
          {post.passengers != null && <Detail k="Passengers" v={String(post.passengers)} />}
          {post.luggage && <Detail k="Luggage" v={post.luggage} />}
          {post.specialsFee != null && <Detail k="Specials fee" v={`+R${post.specialsFee}`} />}
        </dl>
        {post.specials && (
          <p className="mt-3 text-sm">
            <span className="text-muted-foreground">Specials:</span> {post.specials}
          </p>
        )}
        {post.notes && <p className="mt-3 text-sm text-muted-foreground">{post.notes}</p>}
      </div>

      {!isMine && post.open && !myRequest && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Choose pickup point</h2>
            <span className="text-xs text-muted-foreground">Select how to meet</span>
          </div>

          {/* Segmented Selector */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setPickupType("live");
                if (liveLocationStr.includes("Estimated")) {
                  detectLiveLocation();
                }
              }}
              className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-all cursor-pointer ${
                pickupType === "live"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Navigation className="h-3.5 w-3.5" />
              Live Location
            </button>
            <button
              type="button"
              onClick={() => setPickupType("custom")}
              className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-all cursor-pointer ${
                pickupType === "custom"
                  ? "bg-card text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              Enter Location
            </button>
          </div>

          {/* Live Location Panel */}
          {pickupType === "live" && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-start gap-2.5">
                <div
                  className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary ${isLocating ? "animate-pulse" : ""}`}
                >
                  <Navigation className={`h-3 w-3 ${isLocating ? "animate-spin" : ""}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Detected Location
                  </div>
                  <div className="text-sm font-medium leading-tight">
                    {isLocating ? (
                      <span className="text-muted-foreground animate-pulse">
                        Detecting your location...
                      </span>
                    ) : (
                      liveLocationStr
                    )}
                  </div>
                  {locationError && (
                    <div className="text-xs text-destructive/95 mt-1 font-medium">
                      ⚠️ {locationError} using fallback.
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={detectLiveLocation}
                  disabled={isLocating}
                  className="rounded-lg bg-card border px-2.5 py-1 text-xs font-semibold shadow-xs hover:bg-secondary disabled:opacity-50 transition-colors cursor-pointer"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}

          {/* Custom Location Panel */}
          {pickupType === "custom" && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={customPickup}
                  onChange={(e) => setCustomPickup(e.target.value)}
                  placeholder="Enter pickup point (e.g., BP Garage on N1...)"
                  className="w-full rounded-lg border bg-background pl-3 pr-8 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                {customPickup && (
                  <button
                    type="button"
                    onClick={() => setCustomPickup("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Suggestions */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {PICKUPS.map((p) => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setCustomPickup(p)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-all cursor-pointer ${
                        customPickup === p
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleSendRequest}
            disabled={isSendingRequest || sendRequest.isPending}
            className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/95 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isSendingRequest ? "Sending..." : me.role === "hiker" ? "Request this ride" : "Offer this ride"}
          </button>
        </div>
      )}

      {!isMine && myRequest && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Your request</h2>
              <p className="text-xs text-muted-foreground">
                Sent {new Date(myRequest.createdAt).toLocaleString()}
              </p>
            </div>
            <StatusChip status={myRequest.status} requestId={myRequest.id} />
          </div>
          {myRequest.status === "accepted" && (
            <>
              <button
                onClick={handleRecordPayment}
                disabled={addPayment.isPending || updateRequest.isPending}
                className="mt-3 w-full rounded-full bg-success py-2.5 text-sm font-semibold text-success-foreground cursor-pointer disabled:opacity-60"
              >
                Record payment (R{post.pricePerSeat})
              </button>
              <button
                onClick={handleCancelRide}
                className="mt-2 w-full rounded-full border border-destructive/40 bg-destructive/5 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition cursor-pointer"
              >
                Cancel my ride
              </button>
            </>
          )}
        </div>
      )}

      {isMine && post.open && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold">
            Incoming {me.role === "driver" ? "requests" : "offers"} ({incoming.length})
          </h2>
          <div className="mt-3 space-y-2">
            {incoming.length === 0 && <p className="text-sm text-muted-foreground">Nothing yet.</p>}
            {incoming.map((r) => {
              const u = users.find((usr) => usr.id === r.fromUserId);
              if (!u) return null;
              return (
                <div key={r.id} className="flex flex-col gap-2.5 rounded-xl bg-secondary p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        user={u}
                        className="h-8 w-8 text-xl flex items-center justify-center rounded-full bg-secondary overflow-hidden object-cover"
                      />
                      <div>
                        <div className="text-sm font-medium">{u.name}</div>
                        {r.pickupPoint && (
                          <div className="text-xs text-muted-foreground">
                            Pickup: {r.pickupPoint}
                          </div>
                        )}
                      </div>
                    </div>
                    {r.status !== "pending" && <StatusChip status={r.status} requestId={r.id} />}
                  </div>

                  {r.status === "pending" && (
                    <div className="flex flex-col gap-2 border-t pt-2 border-border/50 mt-1">
                      <p className="text-xs font-medium text-muted-foreground text-left">
                        {me.role === "driver"
                          ? "This hiker wants to join your ride. Agree to their request?"
                          : "This driver wants to offer you a ride. Agree to their offer?"}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAcceptRequest(r.id)}
                          disabled={updateRequest.isPending}
                          className="flex-1 rounded-full bg-success py-1.5 text-xs font-semibold text-success-foreground cursor-pointer hover:bg-success/95 transition-colors disabled:opacity-60"
                        >
                          <Check className="inline h-3.5 w-3.5 mr-1" /> Agree & Confirm
                        </button>
                        <button
                          onClick={() => handleRejectRequest(r.id)}
                          disabled={updateRequest.isPending}
                          className="rounded-full bg-muted px-4 py-1.5 text-xs font-medium cursor-pointer hover:bg-muted/80 transition-colors disabled:opacity-60"
                        >
                          <X className="inline h-3.5 w-3.5 mr-1" /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={handleClosePost}
              disabled={closePost.isPending}
              className="w-full rounded-full bg-clay py-2.5 text-sm font-semibold text-clay-foreground hover:brightness-110 transition cursor-pointer disabled:opacity-60"
            >
              {me.role === "driver" ? "Mark as Full / Booked" : "Ride found — close post"}
            </button>
            <button
              onClick={handleDeletePost}
              disabled={deletePost.isPending}
              className="w-full rounded-full border border-destructive/40 bg-destructive/5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition cursor-pointer disabled:opacity-60"
            >
              Delete Post
            </button>
          </div>
        </div>
      )}

      {isMine && !post.open && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={handleDeletePost}
              disabled={deletePost.isPending}
              className="w-full rounded-full border border-destructive/40 bg-destructive/5 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition cursor-pointer disabled:opacity-60"
            >
              Delete Post
            </button>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
        <h2 className="font-display text-base font-semibold flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4 text-primary" />
          Comments ({comments.length})
        </h2>
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {comments.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No comments yet. Be the first!</p>
          )}
          {comments
            .sort((a, b) => a.createdAt - b.createdAt)
            .map((c) => {
              const commentAuthor = users.find((u) => u.id === c.authorId);
              const isMyComment = c.authorId === me.id;
              return (
                <div key={c.id} className="flex gap-2.5 group">
                  <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full bg-secondary text-sm overflow-hidden">
                    {commentAuthor && <UserAvatar user={commentAuthor} className="w-full h-full text-[11px] flex items-center justify-center rounded-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold">{commentAuthor?.name ?? "Unknown"}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {isMyComment && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          disabled={deleteCommentMut.isPending}
                          className="ml-auto opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive cursor-pointer disabled:opacity-40"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              );
            })}
        </div>
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            maxLength={300}
            className="flex-1 rounded-full border bg-secondary/40 px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          <button
            type="submit"
            disabled={!commentText.trim() || addCommentMut.isPending}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 cursor-pointer hover:bg-primary/90 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* Post-ride Rating Card */}
      {rideIsComplete && targetForRating && !alreadyRated && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-sm space-y-3">
          <h2 className="font-display text-base font-semibold flex items-center gap-1.5">
            <Star className="h-4 w-4 text-amber-500" />
            Rate your {isMine ? "rider" : "driver"}: {targetForRating.name}
          </h2>
          {!showRatingForm ? (
            <button
              onClick={() => setShowRatingForm(true)}
              className="w-full rounded-full bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition cursor-pointer"
            >
              ⭐ Leave a rating
            </button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!ratingComment.trim()) return;
                addReview.mutate({
                  driverId: targetForRating.role === "driver" ? targetForRating.id : me.id,
                  rating: ratingStars,
                  comment: ratingComment.trim(),
                });
                setShowRatingForm(false);
                setRatingComment("");
              }}
              className="space-y-3"
            >
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingStars(star)}
                    className="cursor-pointer transition-transform hover:scale-110"
                  >
                    <span className={`text-2xl ${star <= ratingStars ? "text-amber-500" : "text-muted-foreground/30"}`}>★</span>
                  </button>
                ))}
              </div>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                rows={2}
                maxLength={300}
                placeholder={isMine ? "How was this rider as a passenger?" : "How was this driver — safe, punctual, reliable?"}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRatingForm(false)}
                  className="flex-1 rounded-full bg-muted py-2 text-sm font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!ratingComment.trim() || addReview.isPending}
                  className="flex-1 rounded-full bg-amber-500 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition cursor-pointer disabled:opacity-40"
                >
                  Submit Rating
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {rideIsComplete && targetForRating && alreadyRated && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center text-xs text-emerald-600 font-medium">
          ✅ You've already rated {targetForRating.name} for this ride.
        </div>
      )}

      {!isMine && (
        <button
          onClick={() => setFlagOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-destructive/40 bg-destructive/5 py-2.5 text-sm font-medium text-destructive cursor-pointer"
        >
          <ShieldAlert className="h-4 w-4" />
          Flag {author.name} to the red list
        </button>
      )}

      {flagOpen && (
        <FlagDialog
          onClose={() => setFlagOpen(false)}
          onSubmit={(reason, detail) => {
            addFlag.mutate({
              flaggedUserId: author.id,
              reporterRole: me.role,
              reason,
              detail,
            });
            setFlagOpen(false);
            navigate({ to: "/redlist" });
          }}
        />
      )}

      <Link to="/redlist" className="block text-center text-xs text-muted-foreground underline">
        View red list
      </Link>
    </div>
  );
}

function Detail({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd className="font-medium">{v}</dd>
    </div>
  );
}

function FlagDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (
    reason: "wrong_dropoff" | "no_show" | "unsafe_driving" | "payment_issue" | "other",
    detail: string,
  ) => void;
}) {
  const [reason, setReason] = useState<
    "wrong_dropoff" | "no_show" | "unsafe_driving" | "payment_issue" | "other"
  >("wrong_dropoff");
  const [detail, setDetail] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-card p-5 shadow-xl">
        <h2 className="font-display text-xl font-bold">Flag this user</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Help others travel safer. Only flag based on real, broken agreements.
        </p>
        <div className="mt-4 space-y-2 text-sm">
          {[
            ["wrong_dropoff", "Dropped at wrong location"],
            ["no_show", "No-show / didn't arrive"],
            ["unsafe_driving", "Unsafe driving"],
            ["payment_issue", "Payment issue"],
            ["other", "Other"],
          ].map(([v, l]) => (
            <label key={v} className="flex items-center gap-2">
              <input
                type="radio"
                checked={reason === v}
                onChange={() => setReason(v as typeof reason)}
              />
              {l}
            </label>
          ))}
        </div>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="What happened?"
          className="mt-3 w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-full bg-muted py-2.5 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(reason, detail)}
            className="flex-1 rounded-full bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground"
          >
            Submit flag
          </button>
        </div>
      </div>
    </div>
  );
}
