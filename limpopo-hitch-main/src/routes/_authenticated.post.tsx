import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useCurrentUser, useCreatePost } from "@/lib/api-hooks";
import { TextField } from "./onboarding.hiker";
import { Camera, X, MapPin } from "lucide-react";
import { filterLocationsBySlang } from "@/lib/location-aliases";

function LocationField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = filterLocationsBySlang(value, 8);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? "Search town (e.g. PLK, Joza)..."}
          autoComplete="off"
          className="w-full rounded-lg border bg-background pl-9 pr-8 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-xl border bg-card shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          {filtered.map((item) => (
            <li key={item.name}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(item.name); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-secondary transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.matchedAlias && (
                  <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase">
                    matches "{item.matchedAlias}"
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/post")({
  head: () => ({ meta: [{ title: "Post a ride" }] }),
  component: PostPage,
});

function PostPage() {
  const { data: me, isLoading: meLoading } = useCurrentUser();
  const createPost = useCreatePost();
  const navigate = useNavigate();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // hiker
  const [passengers, setPassengers] = useState("1");
  const [luggage, setLuggage] = useState<"none" | "small" | "large">("none");
  const [specials, setSpecials] = useState("");
  const [specialsFee, setSpecialsFee] = useState("");
  // driver
  const [seats, setSeats] = useState("4");

  // driver car upload & plate hider
  const [carPhoto, setCarPhoto] = useState<string>("");
  const [hidePlate, setHidePlate] = useState(true);
  const [plateX, setPlateX] = useState(40);
  const [plateY, setPlateY] = useState(65);
  const [plateW, setPlateW] = useState(20);
  const [plateH, setPlateH] = useState(7);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [posStart, setPosStart] = useState({ x: 40, y: 65 });

  useEffect(() => {
    if (me?.seats) setSeats(String(me.seats));
  }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!meLoading && !me) {
      navigate({ to: "/auth" });
    }
  }, [meLoading, me, navigate]);

  if (meLoading || !me) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-xs font-semibold text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPosStart({ x: plateX, y: plateY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;
    setPlateX(Math.max(0, Math.min(100 - plateW, posStart.x + dx)));
    setPlateY(Math.max(0, Math.min(100 - plateH, posStart.y + dy)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handleCarPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const maxDim = 600;
        let w = img.width;
        let h = img.height;
        if (w > h) { if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; } }
        else { if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; } }
        canvas.width = w;
        canvas.height = h;
        ctx?.drawImage(img, 0, 0, w, h);
        setCarPhoto(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!from.trim() || !to.trim() || !date || !price) {
      setErrorMsg("Please fill in From, To, Date, and Price before publishing.");
      return;
    }

    let finalCarPhoto = "";
    if (me.role === "driver" && carPhoto) {
      if (hidePlate) {
        finalCarPhoto = await new Promise<string>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(carPhoto); return; }
            ctx.drawImage(img, 0, 0);
            const rx = (plateX / 100) * canvas.width;
            const ry = (plateY / 100) * canvas.height;
            const rw = (plateW / 100) * canvas.width;
            const rh = (plateH / 100) * canvas.height;
            ctx.fillStyle = "#0a0a0a";
            ctx.fillRect(rx, ry, rw, rh);
            ctx.fillStyle = "#f59e0b";
            const fontSize = Math.max(10, Math.floor(rh * 0.35));
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("PLATE HIDDEN", rx + rw / 2, ry + rh / 2);
            resolve(canvas.toDataURL("image/jpeg", 0.8));
          };
          img.src = carPhoto;
        });
      } else {
        finalCarPhoto = carPhoto;
      }
    }

    try {
      await createPost.mutateAsync({
        from: from.trim(),
        to: to.trim(),
        date,
        time: time || "06:00",
        pricePerSeat: Number(price),
        notes,
        carPhoto: finalCarPhoto || undefined,
        ...(me.role === "hiker"
          ? { passengers: Number(passengers), luggage, specials, specialsFee: specialsFee ? Number(specialsFee) : undefined }
          : { seats: Number(seats), specialsFee: specialsFee ? Number(specialsFee) : undefined }),
      });
      navigate({ to: "/feed" });
    } catch (err: any) {
      console.error("Failed to publish post:", err);
      const msg =
        err.response?.data?.error ||
        err.message ||
        "Could not publish post. Please check your connection and try again.";
      setErrorMsg(msg);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">
        {me.role === "hiker" ? "Post a ride request" : "Post a trip"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {me.role === "hiker"
          ? "Tell drivers where you're going and what you'll pay."
          : "Tell hikers your route, date and price per seat."}
      </p>

      {errorMsg && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="grid grid-cols-2 gap-3">
          <LocationField label="From" value={from} onChange={setFrom} placeholder="e.g. Polokwane" />
          <LocationField label="To" value={to} onChange={setTo} placeholder="e.g. Tzaneen" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Date" value={date} onChange={setDate} type="date" />
          <TextField label="Time" value={time} onChange={setTime} type="time" />
        </div>
        <TextField
          label={me.role === "hiker" ? "Fee you'll pay per person (R)" : "Price per seat (R)"}
          value={price}
          onChange={setPrice}
          type="number"
          placeholder="250"
        />

        {me.role === "hiker" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Number of people"
                value={passengers}
                onChange={setPassengers}
                type="number"
              />
              <div>
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Luggage
                </span>
                <select
                  value={luggage}
                  onChange={(e) => setLuggage(e.target.value as typeof luggage)}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                >
                  <option value="none">None</option>
                  <option value="small">Small</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
            <TextField
              label="Special requests (extra item, animal, etc.)"
              value={specials}
              onChange={setSpecials}
              placeholder="Carrying a small fridge"
            />
            <TextField
              label="Extra fee for specials (R)"
              value={specialsFee}
              onChange={setSpecialsFee}
              type="number"
              placeholder="100"
            />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Seats available" value={seats} onChange={setSeats} type="number" />
              <TextField
                label="Extra fee for specials (R, optional)"
                value={specialsFee}
                onChange={setSpecialsFee}
                type="number"
                placeholder="30"
              />
            </div>

            {/* Car Photo Upload (Driver Only) */}
            <div className="space-y-2 border-t border-border pt-4">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Car Photo & Security
              </span>
              <p className="text-xs text-muted-foreground">
                Help hikers recognize your vehicle. You can position the security hider block over
                your license plate for privacy.
              </p>

              {!carPhoto ? (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-secondary/50 transition-colors">
                  <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-semibold text-primary">Upload car photo</span>
                  <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCarPhotoSelect}
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">Car photo uploaded</span>
                    <button
                      type="button"
                      onClick={() => setCarPhoto("")}
                      className="text-xs font-semibold text-destructive hover:underline cursor-pointer"
                    >
                      Remove photo
                    </button>
                  </div>

                  {/* Interactive Draggable Hider Preview */}
                  <div
                    ref={containerRef}
                    className="relative overflow-hidden rounded-xl border bg-black select-none"
                    style={{ aspectRatio: "16/9", maxHeight: "280px" }}
                  >
                    <img
                      src={carPhoto}
                      className="w-full h-full object-contain pointer-events-none"
                      alt="Car upload preview"
                    />

                    {hidePlate && (
                      <div
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        className="absolute flex items-center justify-center bg-black border border-amber-500 text-[10px] font-bold text-amber-500 rounded cursor-move select-none shadow-lg"
                        style={{
                          left: `${plateX}%`,
                          top: `${plateY}%`,
                          width: `${plateW}%`,
                          height: `${plateH}%`,
                          touchAction: "none",
                        }}
                      >
                        ⚠️ HIDER (DRAG)
                      </div>
                    )}
                  </div>

                  {/* Settings */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-secondary/40 rounded-xl p-3 border">
                    <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hidePlate}
                        onChange={(e) => setHidePlate(e.target.checked)}
                        className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                      />
                      Hide License Plate
                    </label>

                    {hidePlate && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                        <span>Size:</span>
                        <button
                          type="button"
                          onClick={() => setPlateW((prev) => Math.max(10, prev - 2))}
                          className="px-1.5 py-0.5 border rounded bg-card hover:bg-secondary cursor-pointer"
                        >
                          W-
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlateW((prev) => Math.min(40, prev + 2))}
                          className="px-1.5 py-0.5 border rounded bg-card hover:bg-secondary cursor-pointer"
                        >
                          W+
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlateH((prev) => Math.max(3, prev - 1))}
                          className="px-1.5 py-0.5 border rounded bg-card hover:bg-secondary cursor-pointer"
                        >
                          H-
                        </button>
                        <button
                          type="button"
                          onClick={() => setPlateH((prev) => Math.min(15, prev + 1))}
                          className="px-1.5 py-0.5 border rounded bg-card hover:bg-secondary cursor-pointer"
                        >
                          H+
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <div>
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
            placeholder="Pickup near Indian Centre rank…"
          />
        </div>

        <button
          disabled={createPost.isPending}
          className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/95 disabled:opacity-50 cursor-pointer shadow-md transition-colors"
        >
          {createPost.isPending ? "Processing photo & publishing..." : "Publish post"}
        </button>
      </form>
    </div>
  );
}
