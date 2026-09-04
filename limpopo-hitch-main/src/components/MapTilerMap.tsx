import { MapPin, Navigation, Flag } from "lucide-react";

interface MapTilerMapProps {
  from: string;
  to: string;
  pickup?: string;
  driverCoords?: { lat: number; lng: number };
  hikerCoords?: { lat: number; lng: number };
  className?: string;
}

export function MapTilerMap({
  from,
  to,
  pickup,
  className = "",
}: MapTilerMapProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-800 ${className}`}
      style={{ minHeight: "160px" }}
    >
      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Dotted route line */}
      <div className="absolute inset-0 flex items-center justify-center px-10 pointer-events-none">
        <div className="w-full flex items-center gap-0">
          <div className="h-3 w-3 rounded-full bg-indigo-400 shrink-0 shadow-lg shadow-indigo-500/50" />
          <div
            className="flex-1 border-t-2 border-dashed border-indigo-400/50"
            style={{ minWidth: 0 }}
          />
          <div className="h-3 w-3 rounded-full bg-emerald-400 shrink-0 shadow-lg shadow-emerald-500/50" />
        </div>
      </div>

      {/* Route info */}
      <div className="relative z-10 flex flex-col justify-between h-full p-4 gap-3">
        {/* From */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-400/40 shrink-0">
            <Navigation className="h-3.5 w-3.5 text-indigo-300" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-indigo-300/70">
              From
            </div>
            <div className="text-sm font-bold text-white leading-tight">{from}</div>
          </div>
        </div>

        {/* Pickup (if available) */}
        {pickup && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 border border-amber-400/40 shrink-0">
              <MapPin className="h-3.5 w-3.5 text-amber-300" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-300/70">
                Pickup
              </div>
              <div className="text-sm font-bold text-white leading-tight truncate max-w-[220px]">
                {pickup}
              </div>
            </div>
          </div>
        )}

        {/* To */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400/40 shrink-0">
            <Flag className="h-3.5 w-3.5 text-emerald-300" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300/70">
              To
            </div>
            <div className="text-sm font-bold text-white leading-tight">{to}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
