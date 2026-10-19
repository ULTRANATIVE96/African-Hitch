import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  LogOut,
  Camera,
  Edit3,
  Car,
  Shield,
  ShieldCheck,
  Check,
  X,
  ArrowLeftRight,
  Star,
  ChevronRight,
  FileText,
  Lock,
} from "lucide-react";
import { useCurrentUser, useUpdateProfile, useAllUsers, useUserReviews, type Role } from "@/lib/api-hooks";
import { UserAvatar } from "@/components/UserAvatar";
import { clearSession } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — HikeConnect" }] }),
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

  if (isLoading || !me) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3 text-center">
        <div className="h-9 w-9 animate-spin rounded-full border-3 border-[#14382b] border-t-transparent mx-auto" />
        <p className="text-xs font-semibold text-[#8a8170]">Loading profile...</p>
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

  const ratingFormatted = typeof me.rating === "number" ? me.rating.toFixed(1) : "5.0";
  const userEmail = me.email || me.googleEmail || "hlayisekohh7@gmail.com";
  const displayPhone = me.phone || "0761824735";

  return (
    <div className="space-y-4">
      {/* ─── Hero Profile Card with Deep Forest Green & Topography ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#14382b] p-6 sm:p-7 text-white shadow-md">
        {/* Subtle contour lines vector background */}
        <div className="absolute inset-0 pointer-events-none opacity-10 select-none overflow-hidden">
          <svg className="w-full h-full object-cover" viewBox="0 0 500 250" fill="none">
            <path
              d="M-50 120 C100 80, 200 200, 350 110 C450 60, 550 140, 600 90"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            <path
              d="M-50 160 C120 120, 220 230, 370 140 C470 100, 560 170, 620 130"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <path
              d="M-50 200 C140 160, 240 260, 390 170 C490 140, 570 200, 640 170"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            {/* Avatar with Verified checkmark badge and photo upload */}
            <div className="relative h-20 w-20 shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1e4e3d] text-4xl overflow-hidden object-cover select-none ring-4 ring-white/20 shadow-md">
                {me.profilePhoto ? (
                  <img src={me.profilePhoto} className="h-full w-full object-cover" alt={me.name} />
                ) : (
                  me.avatar || "😀"
                )}
              </div>
              {/* Verified check badge */}
              <div
                className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#10b981] text-white ring-2 ring-[#14382b] shadow-xs"
                title="Verified User"
              >
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </div>
              {/* Camera icon to upload image */}
              <label
                className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white text-[#14382b] ring-2 ring-[#14382b] hover:bg-gray-100 transition shadow-xs"
                title="Change photo"
              >
                <Camera className="h-3 w-3" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>

            {/* User Name, Role Pill, Rating */}
            <div className="space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-white leading-tight">
                {me.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                <span className="rounded-full bg-[#ffeedb] px-2.5 py-0.5 text-[11px] font-bold text-[#c85a17] border border-[#fed7aa]/60 capitalize">
                  {me.role}
                </span>
                <span className="text-xs font-semibold text-emerald-200 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span>{ratingFormatted}</span>
                  <span className="text-white/60 font-normal">({reviews.length} reviews)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <div className="w-full sm:w-auto">
            {!editing ? (
              <button
                type="button"
                onClick={startEdit}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xs transition cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-semibold text-white backdrop-blur-xs transition cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── Edit Profile Form (Active when editing) ─────────── */}
      {editing && (
        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-[#e8e4d8] bg-white p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#f0ece1] pb-3">
            <h2 className="font-display text-base font-bold text-[#111827]">Edit Profile Details</h2>
            <span className="text-xs text-[#8a8170]">Instant sync</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-[#e8e4d8] bg-[#fcfbf7] px-3.5 py-2 text-sm outline-none focus:border-[#14382b] focus:ring-2 focus:ring-[#14382b]/15"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="076 182 4735"
                className="w-full rounded-xl border border-[#e8e4d8] bg-[#fcfbf7] px-3.5 py-2 text-sm outline-none focus:border-[#14382b] focus:ring-2 focus:ring-[#14382b]/15"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-xl border border-[#e8e4d8] bg-[#fcfbf7] px-3.5 py-2 text-sm outline-none focus:border-[#14382b] focus:ring-2 focus:ring-[#14382b]/15 capitalize"
              >
                <option value="hiker">Hiker (Passenger)</option>
                <option value="driver">Driver</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#374151] mb-1">Emoji Avatar</label>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                {EMOJI_AVATARS.map((e) => (
                  <button
                    type="button"
                    key={e}
                    onClick={() => setAvatar(e)}
                    className={`h-8 w-8 text-base rounded-xl flex items-center justify-center border transition cursor-pointer ${
                      avatar === e ? "border-[#14382b] bg-[#14382b]/10 scale-105" : "border-[#e8e4d8] hover:bg-[#ede9dc]"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Driver specific vehicle details */}
          {role === "driver" && (
            <div className="border-t border-[#f0ece1] pt-3 space-y-3">
              <h3 className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                <Car className="h-4 w-4 text-[#14382b]" /> Vehicle Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#6b7280] mb-1">Model</label>
                  <input
                    type="text"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    placeholder="Toyota Quantum"
                    className="w-full rounded-xl border border-[#e8e4d8] bg-[#fcfbf7] px-3 py-2 text-xs outline-none focus:border-[#14382b]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6b7280] mb-1">Plate Number</label>
                  <input
                    type="text"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    placeholder="DL 45 GP"
                    className="w-full rounded-xl border border-[#e8e4d8] bg-[#fcfbf7] px-3 py-2 text-xs outline-none focus:border-[#14382b]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#6b7280] mb-1">Seats</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#e8e4d8] bg-[#fcfbf7] px-3 py-2 text-xs outline-none focus:border-[#14382b]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f0ece1]">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-xl border border-[#e8e4d8] px-4 py-2 text-xs font-semibold text-[#4b5563] hover:bg-[#ede9dc] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#14382b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1b4a3a] transition cursor-pointer shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* ─── Contact Info Card (3 Columns: Phone, Email, Location) ─── */}
      <div className="rounded-2xl border border-[#e8e4d8] bg-white p-4 shadow-xs">
        <div className="grid grid-cols-3 divide-x divide-[#f0ece1] text-center">
          <div className="px-2">
            <div className="text-xs font-bold text-[#111827] truncate">
              {displayPhone}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8a8170] mt-0.5">
              Phone
            </div>
          </div>

          <div className="px-2">
            <div className="text-xs font-bold text-[#111827] truncate" title={userEmail}>
              {userEmail}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8a8170] mt-0.5">
              Email
            </div>
          </div>

          <div className="px-2">
            <div className="text-xs font-bold text-[#111827] truncate">
              Limpopo, SA
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8a8170] mt-0.5">
              Location
            </div>
          </div>
        </div>
      </div>

      {/* ─── Account & Safety Section ───────────────────────── */}
      <div className="rounded-2xl border border-[#e8e4d8] bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1f2937]">
            Account & Safety
          </h2>
          <button
            type="button"
            onClick={startEdit}
            className="text-xs font-semibold text-[#14382b] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>Manage</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="divide-y divide-[#f0ece1]">
          {/* Identity Verification */}
          <div className="flex items-center justify-between py-3 group hover:bg-[#fcfbf7] px-2 rounded-xl transition cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#111827] flex items-center gap-1.5">
                  Verify your identity
                  <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700">
                    Active
                  </span>
                </div>
                <div className="text-[11px] text-[#6b7280]">
                  National ID & Driver's License verification
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#8a8170] group-hover:text-[#14382b] group-hover:translate-x-0.5 transition" />
          </div>

          {/* Vehicle & Plate verification */}
          <div
            onClick={startEdit}
            className="flex items-center justify-between py-3 group hover:bg-[#fcfbf7] px-2 rounded-xl transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffeedb] text-[#c85a17] border border-[#fed7aa]/60">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#111827]">
                  Vehicle & Plate verification
                </div>
                <div className="text-[11px] text-[#6b7280]">
                  {me.role === "driver" && me.vehicle
                    ? `${me.vehicle} (${me.plate || "Registered"})`
                    : "Register your vehicle to offer rides"}
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#8a8170] group-hover:text-[#14382b] group-hover:translate-x-0.5 transition" />
          </div>

          {/* Safety Settings */}
          <Link
            to="/redlist"
            className="flex items-center justify-between py-3 group hover:bg-[#fcfbf7] px-2 rounded-xl transition"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#111827]">
                  Safety settings & Red List
                </div>
                <div className="text-[11px] text-[#6b7280]">
                  Community flags, trust standards, and ride protocols
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-[#8a8170] group-hover:text-[#14382b] group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      </div>

      {/* ─── Your Appeals Notice Banner ─────────────────────── */}
      <div className="rounded-2xl border border-[#fed7aa] bg-[#fff7ed] p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffedd5] text-[#c85a17] shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#9a3412]">Your Appeals & Disputes</div>
            <div className="text-[11px] text-[#c2410c]/90">
              Have an active dispute or warning on Red List? Submit or review your appeal.
            </div>
          </div>
        </div>
        <Link
          to="/appeal"
          className="shrink-0 rounded-xl bg-white border border-[#fed7aa] px-3 py-1.5 text-xs font-semibold text-[#c85a17] hover:bg-[#ffedd5] transition shadow-xs flex items-center gap-1"
        >
          <span>View</span>
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* ─── Dual Account Linked Card (if present) ──────────── */}
      {linkedUser && (
        <div className="rounded-2xl border border-[#e8e4d8] bg-white p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-[#111827]">
              <ArrowLeftRight className="h-4 w-4 text-[#14382b]" />
              <span>Linked Account</span>
            </div>
            <span className="rounded-full bg-[#14382b]/10 px-2 py-0.5 text-[10px] font-bold text-[#14382b] capitalize">
              {linkedUser.role} mode
            </span>
          </div>
          <p className="text-xs text-[#6b7280]">
            You have a linked {linkedUser.role} profile registered under the same phone number.
          </p>
        </div>
      )}

      {/* ─── Reviews & Ratings Section ──────────────────────── */}
      <div className="rounded-2xl border border-[#e8e4d8] bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0ece1] pb-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1f2937] flex items-center gap-1.5">
              <span>Reviews & Ratings</span>
            </h2>
            <p className="text-[11px] text-[#8a8170]">Verified trip passenger and driver feedback</p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#ffeedb] text-[#c85a17] px-2.5 py-1 rounded-full text-xs font-bold border border-[#fed7aa]/60">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>{ratingFormatted}</span>
            <span className="text-[10px] font-normal opacity-80">({reviews.length})</span>
          </div>
        </div>

        {reviewsLoading ? (
          <div className="py-6 text-center text-xs text-[#8a8170]">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-[#e8e4d8] rounded-xl space-y-2 bg-[#fcfbf7]">
            <div className="h-10 w-10 rounded-full bg-[#ede9dc] flex items-center justify-center mx-auto text-[#8a8170]">
              <Star className="h-5 w-5 text-[#8a8170]/60" />
            </div>
            <div className="font-bold text-xs text-[#111827]">No reviews yet</div>
            <p className="text-[11px] text-[#8a8170] max-w-xs mx-auto">
              Completed trip reviews and ratings from drivers or passengers will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {reviews.map((rev) => {
              const revAuthor = rev.author || allUsers.find((u) => u.id === rev.authorId);
              return (
                <div key={rev.id} className="rounded-xl border border-[#e8e4d8] bg-[#fcfbf7] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-[#ede9dc] overflow-hidden flex items-center justify-center text-xs">
                        {revAuthor ? (
                          <UserAvatar user={revAuthor as any} className="h-full w-full object-cover" />
                        ) : (
                          "👤"
                        )}
                      </div>
                      <div className="text-xs font-semibold text-[#111827]">
                        {revAuthor?.name ?? "Verified User"}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${
                            s <= Math.round(rev.rating)
                              ? "text-amber-400 fill-amber-400"
                              : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {rev.comment && (
                    <p className="text-xs text-[#4b5563] bg-white p-2 rounded-lg border border-[#e8e4d8]">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Sign Out Button ────────────────────────────────── */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            clearSession();
            navigate({ to: "/auth" });
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-white py-3 text-sm font-semibold text-red-600 hover:bg-red-50 hover:border-red-300 transition shadow-xs cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );
}
