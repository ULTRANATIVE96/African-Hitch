import { MapPin } from "lucide-react";

export function MapPlaceholder({
  from,
  to,
  pickup,
}: {
  from: string;
  to: string;
  pickup?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-ochre/30 via-secondary to-primary/10 p-6">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,var(--color-foreground)_1px,transparent_0)] [background-size:18px_18px]" />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" /> Route preview
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-3 w-3 rounded-full bg-primary ring-4 ring-primary/20" />
          <div className="text-lg font-semibold">{from}</div>
        </div>
        <div className="ml-1.5 h-10 w-[2px] border-l-2 border-dashed border-primary/50" />
        <div className="flex items-center gap-3">
          <div className="flex h-3 w-3 rounded-full bg-accent ring-4 ring-accent/20" />
          <div className="text-lg font-semibold">{to}</div>
        </div>
        {pickup && (
          <div className="mt-3 rounded-lg bg-card/80 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Pickup:</span>{" "}
            <span className="font-medium">{pickup}</span>
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Live map and turn-by-turn directions will appear here once the maps integration is
          connected.
        </p>
      </div>
    </div>
  );
}
