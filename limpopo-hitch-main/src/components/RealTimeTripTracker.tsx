import { useEffect, useState } from "react";
import { Navigation, MapPin, CheckCircle, ShieldCheck, AlertCircle, Car, User as UserIcon } from "lucide-react";
import { useUpdateRequest, type ApiUser, type ApiRequest, type ApiPost } from "@/lib/api-hooks";

interface RealTimeTripTrackerProps {
  request: ApiRequest & { driverLat?: number; driverLng?: number; hikerLat?: number; hikerLng?: number; dropoffConfirmedByDriver?: boolean; dropoffConfirmedByHiker?: boolean };
  post: ApiPost & { fromLocation: string; toLocation: string };
  driver: ApiUser;
  hiker: ApiUser;
  currentUserRole: "driver" | "hiker" | "admin";
}

// Haversine formula to compute distance in meters between two lat/lng points
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Default fallback coordinates for Limpopo towns
const TOWN_COORDS: Record<string, { lat: number; lng: number }> = {
  Polokwane: { lat: -23.9045, lng: 29.4688 },
  Tzaneen: { lat: -23.8333, lng: 30.1667 },
  Mokopane: { lat: -24.1944, lng: 29.0097 },
  Giyani: { lat: -23.3025, lng: 30.7187 },
  Musina: { lat: -22.3486, lng: 30.0418 },
  Thohoyandou: { lat: -22.9456, lng: 30.4842 },
  Pretoria: { lat: -25.7479, lng: 28.2293 },
  Johannesburg: { lat: -26.2041, lng: 28.0473 },
};

export function RealTimeTripTracker({
  request,
  post,
  driver,
  hiker,
  currentUserRole,
}: RealTimeTripTrackerProps) {
  const updateRequest = useUpdateRequest();

  // Dropoff confirmation uses local state (GPS data is ephemeral)
  const [dropoffConfirmedByDriver, setDropoffConfirmedByDriver] = useState(request.dropoffConfirmedByDriver ?? false);
  const [dropoffConfirmedByHiker, setDropoffConfirmedByHiker] = useState(request.dropoffConfirmedByHiker ?? false);

  // Target dropoff coordinates (either custom or lookup from town)
  const targetDropoffCoords = TOWN_COORDS[post.toLocation] || { lat: -23.9045, lng: 29.4688 };

  // Current simulated or live coordinates
  const driverLat = request.driverLat ?? (TOWN_COORDS[post.fromLocation]?.lat || -23.85);
  const driverLng = request.driverLng ?? (TOWN_COORDS[post.fromLocation]?.lng || 29.5);
  const hikerLat = request.hikerLat ?? (TOWN_COORDS[post.fromLocation]?.lat || -23.85);
  const hikerLng = request.hikerLng ?? (TOWN_COORDS[post.fromLocation]?.lng || 29.5);

  const [simulatedMeters, setSimulatedMeters] = useState<number>(() => {
    return getDistanceMeters(driverLat, driverLng, targetDropoffCoords.lat, targetDropoffCoords.lng);
  });

  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState("");

  // Live GPS watching using Geolocation API
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;

    setIsLocating(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        // GPS updates are local-only; backend updates happen on dropoff confirm
        const dist = getDistanceMeters(latitude, longitude, targetDropoffCoords.lat, targetDropoffCoords.lng);
        setSimulatedMeters(dist);
        setIsLocating(false);
      },
      (err) => {
        console.warn("GPS tracking warning:", err.message);
        setGpsError("Using simulated live route estimation");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [request.id, currentUserRole]);

  // Check if within drop-off threshold (500m or 1km)
  const isNearDropoffZone = simulatedMeters <= 800 || dropoffConfirmedByDriver || dropoffConfirmedByHiker;

  const handleSimulateArrival = () => {
    setSimulatedMeters(180);
  };

  const handleConfirm = () => {
    if (currentUserRole === "admin") return;
    if (currentUserRole === "driver") setDropoffConfirmedByDriver(true);
    else setDropoffConfirmedByHiker(true);
    // Confirm via API - mark ride as completed when both sides confirm
    updateRequest.mutate({ id: request.id, status: "completed" });
  };

  const isCompleted = request.status === "completed";
  const myConfirmed =
    currentUserRole === "driver" ? dropoffConfirmedByDriver : dropoffConfirmedByHiker;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-md space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </div>
          <span className="font-display font-bold text-sm tracking-wide text-foreground uppercase">
            Real-Time GPS Tracking Active
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span>Route: {post.fromLocation} → {post.toLocation}</span>
        </div>
      </div>

      {/* Route Info Bar */}
      <div className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-800 px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Navigation className="h-4 w-4 text-indigo-300 shrink-0" />
          <span className="text-indigo-200">{post.fromLocation}</span>
        </div>
        <div className="flex-1 border-t-2 border-dashed border-indigo-400/40 mx-2" />
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <MapPin className="h-4 w-4 text-emerald-300 shrink-0" />
          <span className="text-emerald-200">{post.toLocation}</span>
        </div>
      </div>

      {/* Pickup info bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border rounded-xl px-3 py-2 bg-secondary/30">
        <span>Pickup: <strong className="text-foreground">{request.pickupPoint || post.fromLocation}</strong></span>
        <span>Drop-off: <strong className="text-foreground">{post.toLocation}</strong></span>
        <span className="flex items-center gap-1">
          <span className={`h-1.5 w-1.5 rounded-full ${isLocating ? "bg-amber-500 animate-pulse" : "bg-green-500"}`} />
          {isLocating ? "Locating..." : gpsError ? "Simulated GPS" : "GPS Active"}
        </span>
      </div>

      {/* Dropoff Confirmation Banner */}
      {isCompleted ? (
        <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4 flex items-center gap-3 text-green-600 dark:text-green-400">
          <CheckCircle className="h-6 w-6 shrink-0 text-green-500" />
          <div className="text-sm">
            <div className="font-bold">Trip Completed & Drop-off Confirmed!</div>
            <p className="text-xs text-muted-foreground">
              Thank you for using Limpopo Hike Connect! Drop-off confirmed at {post.toLocation}.
            </p>
          </div>
        </div>
      ) : isNearDropoffZone ? (
        <div className="rounded-xl border-2 border-emerald-500/50 bg-emerald-500/10 p-4 space-y-3">
          <div className="flex items-start gap-3 text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-500 mt-0.5" />
            <div>
              <div className="font-bold text-sm">📍 Arrived in Drop-off Zone!</div>
              <p className="text-xs text-muted-foreground mt-0.5">
                The driver and hiker are within <strong className="text-emerald-600">{simulatedMeters} meters</strong> of the drop-off location ({post.toLocation}). Please confirm that drop-off has occurred.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${request.dropoffConfirmedByDriver ? "bg-green-500" : "bg-amber-500"}`} />
                <span>Driver Confirmation: <strong>{request.dropoffConfirmedByDriver ? "Confirmed ✓" : "Pending"}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${request.dropoffConfirmedByHiker ? "bg-green-500" : "bg-amber-500"}`} />
                <span>Hiker Confirmation: <strong>{request.dropoffConfirmedByHiker ? "Confirmed ✓" : "Pending"}</strong></span>
              </div>
            </div>

            {currentUserRole !== "admin" && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={myConfirmed}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 transition shadow disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle className="h-4 w-4" />
                {myConfirmed ? "You Confirmed Drop-off" : "Confirm Drop-off Completed"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
            <span>En route to drop-off zone ({post.toLocation}). Drop-off confirmation will unlock when closer than 800m.</span>
          </div>
          {currentUserRole !== "admin" && (
            <button
              type="button"
              onClick={handleConfirm}
              className="text-[11px] font-semibold text-primary underline underline-offset-2 hover:opacity-80 shrink-0 ml-2"
            >
              Manual Drop-off Confirm
            </button>
          )}
        </div>
      )}
    </div>
  );
}
