import type { RequestStatus } from "@/lib/api-hooks";

const LABELS: Record<RequestStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  ride_found: "Ride found",
  full_booked: "Full / Booked",
  completed: "Completed",
};

const STYLES: Record<RequestStatus, string> = {
  pending: "bg-ochre/30 text-ochre-foreground",
  accepted: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  ride_found: "bg-primary/15 text-primary",
  full_booked: "bg-clay/20 text-clay",
  completed: "bg-muted text-muted-foreground",
};

export function StatusChip({ status }: { status: RequestStatus; requestId?: string }) {
  const label = LABELS[status] ?? status;
  const style = STYLES[status] ?? "bg-muted text-muted-foreground";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}
