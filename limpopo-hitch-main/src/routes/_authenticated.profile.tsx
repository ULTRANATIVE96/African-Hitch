import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LogOut, Camera, Edit3, User as UserIcon, Car, Shield, Check, X, ArrowLeftRight, Star, MessageSquare } from "lucide-react";
import { useCurrentUser, useUpdateProfile, useAllUsers, useUserReviews, type Role } from "@/lib/api-hooks";
import { UserAvatar } from "@/components/UserAvatar";
import { clearSession } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Limpopo Hike Connect" }] }),
  component: Profile,
});

const EMOJI_AVATARS = ["😀", "🤠", "🚗", "🧕", "🧔", "🚙", "🚐", "👨‍✈️", "👩‍💼", "🌟"];

function Profile() {
  const { data: me, isLoading } = useCurrentUser();
  const { data: allUsers = [] } = useAllUsers();
  const { data: reviews = [], isLoading: reviewsLoading } = useUserReviews(me?.id || "");
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("hiker");
  const [avatar, setAvatar] = useState("😀");
  const [vehicle, setVehicle] = useState("");
  const [plate, setPlate] = useState("");
  const [seats, setSeats] = useState(4);
  const [vehiclePhoto, setVehiclePhoto] = useState("🚗");

  // Synchronize local form state whenever `me` changes
  useEffect(() => {
    if (me) {
      setName(me.name || "");
      setPhone(me.phone || "");
      setRole(me.role || "hiker");
      setAvatar(me.avatar || "😀");
      setVehicle(me.vehicle || "");
      setPlate(me.plate || "");
      setSeats(me.seats || 4);
      setVehiclePhoto(me.vehiclePhoto || "🚗");
    }
  }, [me]);

  useEffect(() => {
    if (!isLoading && !me) {
      clearSession();
      navigate({ to: "/auth" });
    }
  }, [isLoading, me, navigate]);

  // Fallback if no user is signed in or state is loading
  if (isLoading || !me) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-sm font-medium text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  const linkedUser = me.linkedUserId ? allUsers.find((u) => u.id === me.linkedUserId) : null;

  const startEdit = () => {
    setName(me.name || "");
    setPhone(me.phone || "");
    setRole(me.role || "hiker");
    setAvatar(me.avatar || "😀");
    setVehicle(me.vehicle || "");
    setPlate(me.plate || "");
    setSeats(me.seats || 4);
    setVehiclePhoto(me.vehiclePhoto || "🚗");
    setEditing(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      name: name.trim(),
      phone: phone.trim(),
      avatar,
      vehicle: me.role === "driver" ? vehicle.trim() : undefined,
      plate: me.role === "driver" ? plate.trim() : undefined,
      seats: me.role === "driver" ? Number(seats) : undefined,
      vehiclePhoto: me.role === "driver" ? vehiclePhoto : undefined,
    });
    setEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDim = 300;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        updateProfile.mutate({ profilePhoto: dataUrl });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSwitchAccount = (_targetId: string) => {
    alert("Account switching is managed via the app — please sign out and sign in with the linked account.");
  };

  const ratingFormatted = typeof me.rating === "number" ? me.rating.toFixed(1) : "5.0";
  const ridesCount = me.completedRides ?? 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-4xl overflow-hidden object-cover select-none border-2 border-primary/20">
              {me.profilePhoto ? (
                <img src={me.profilePhoto} className="h-full w-full object-cover" alt="" />
              ) : (
                me.avatar || "😀"
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/95 transition-colors">
              <Camera className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              {me.name}
              {(me as any).verified && (
                <span className="text-xs bg-green-500/15 text-green-600 font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Check className="h-3 w-3" /> Verified
                </span>
              )}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                  me.role === "driver" ? "bg-primary/15 text-primary" : "bg-accent/20 text-accent"
                }`}
              >
                {me.role}
              </span>
              <span>⭐ {ratingFormatted}</span>
              <span>· {ridesCount} rides</span>
            </div>
            {me.phone && <p className="mt-1.5 text-sm text-muted-foreground">📞 {me.phone}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {!editing ? (
            <button
              onClick={startEdit}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-secondary transition cursor-pointer"
            >
              <Edit3 className="h-4 w-4" /> Edit Profile
            </button>
          ) : (
            <button
              onClick={() => setEditing(false)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-xl border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-secondary transition cursor-pointer"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          )}
        </div>
      </div>

      {/* Edit Profile Form Modal/Section */}
      {editing && (
        <form onSubmit={handleSaveProfile} className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="font-display text-lg font-bold">Edit Profile Details</h2>
            <span className="text-xs text-muted-foreground">Changes save instantly</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 072 123 4567"
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 capitalize"
              >
                <option value="hiker">Hiker (Passenger)</option>
                <option value="driver">Driver</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Emoji Avatar</label>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {EMOJI_AVATARS.map((e) => (
                  <button
                    type="button"
                    key={e}
                    onClick={() => setAvatar(e)}
                    className={`h-9 w-9 text-lg rounded-xl flex items-center justify-center border transition ${
                      avatar === e ? "border-primary bg-primary/10" : "border-border hover:bg-secondary"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Driver specific details */}
          {role === "driver" && (
            <div className="border-t pt-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" /> Vehicle Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Vehicle Make / Model</label>
                  <input
                    type="text"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    placeholder="e.g. Toyota Quantum"
                    className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Plate Number</label>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    placeholder="e.g. DL 45 GP"
                    className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Available Seats</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-secondary transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition"
            >
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Details & Vehicle Card */}
        <div className="space-y-6">
          {me.role === "driver" && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" /> Vehicle Details
              </h2>
              {me.vehicle ? (
                <div className="flex items-center gap-3 rounded-xl border bg-background p-3.5">
                  <span className="text-4xl">{me.vehiclePhoto || "🚗"}</span>
                  <div>
                    <div className="font-semibold text-foreground">{me.vehicle}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Plate: <span className="font-medium text-foreground">{me.plate || "N/A"}</span> ·{" "}
                      <span className="font-medium text-foreground">{me.seats ?? 4}</span> seats
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No vehicle details set yet. Click "Edit Profile" to add your car information.
                </p>
              )}
            </div>
          )}

          {/* Dual Account Linked Card */}
          {linkedUser && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-primary" /> Linked Account
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Dual Mode
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                You have a linked <span className="font-semibold capitalize text-foreground">{linkedUser.role}</span> account. You can switch accounts to manage requests or submit appeals for that specific role.
              </p>
              <div className="flex items-center justify-between rounded-xl border bg-background p-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center text-lg select-none">
                    {linkedUser.avatar || "👤"}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{linkedUser.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {linkedUser.role} Account
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleSwitchAccount(linkedUser.id)}
                  className="rounded-xl border bg-primary/10 border-primary/20 text-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition cursor-pointer"
                >
                  Switch Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Appeals & Activity Column */}
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> Your Appeals
              </h2>
              {/* Appeals are submitted via the /appeal page; listed here is just a placeholder */}
              <div className="text-center py-6 border border-dashed rounded-xl space-y-1">
                <p className="text-xs text-muted-foreground">No appeals section available here.</p>
                <p className="text-[11px] text-muted-foreground">
                  If you have unfair flags on the Red List, you can submit an appeal from the Red List page.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              clearSession();
              navigate({ to: "/" });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border bg-card py-3.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </div>

      {/* ─── Previous Rides Reviews Section ─────────────────── */}
      <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-border/70">
          <div>
            <h2 className="font-display text-lg font-semibold flex items-center gap-2 text-foreground">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
              Ride Reviews & Ratings
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Verified feedback from drivers and passengers from completed rides
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full text-sm font-bold">
              <Star className="h-4 w-4 fill-current" />
              <span>{me.rating ? me.rating.toFixed(1) : "5.0"}</span>
              <span className="text-xs font-normal opacity-75">
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{me.completedRides || 0}</span> completed rides
            </div>
          </div>
        </div>

        {reviewsLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-xl space-y-2 bg-secondary/10">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
              <Star className="h-5 w-5 text-muted-foreground/60" />
            </div>
            <div className="font-semibold text-sm text-foreground">No reviews yet</div>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Reviews appear here automatically once you complete rides with accepted passengers or drivers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((rev) => {
              const revAuthor = rev.author || allUsers.find((u) => u.id === rev.authorId);
              return (
                <div key={rev.id} className="rounded-xl border bg-secondary/30 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-secondary overflow-hidden flex items-center justify-center text-sm">
                        {revAuthor ? (
                          <UserAvatar
                            user={revAuthor as any}
                            className="h-full w-full object-cover flex items-center justify-center text-sm"
                          />
                        ) : (
                          "👤"
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {revAuthor?.name ?? "Verified User"}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(rev.createdAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= Math.round(rev.rating)
                              ? "text-amber-500 fill-amber-500"
                              : "text-muted-foreground/25"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {rev.comment && (
                    <p className="text-xs text-foreground/90 leading-relaxed bg-background/60 p-2.5 rounded-lg border border-border/40">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
