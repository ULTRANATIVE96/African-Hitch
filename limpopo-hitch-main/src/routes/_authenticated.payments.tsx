import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUser, useMyPayments } from "@/lib/api-hooks";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({ meta: [{ title: "Payments" }] }),
  component: Payments,
});

function Payments() {
  const { data: me, isLoading } = useCurrentUser();
  const { data: payments = [] } = useMyPayments();

  if (isLoading) return <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!me) return null;

  const mine = [...payments].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Payment history</h1>
        <p className="text-sm text-muted-foreground">
          Every payment recorded for your trips — kept for your safety in case of a dispute.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {mine.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No payments recorded yet.
          </div>
        )}
        {mine.map((p) => {
          const outgoing = p.fromUserId === me.id;
          return (
            <div
              key={p.id}
              className="flex items-center justify-between border-b p-4 last:border-b-0"
            >
              <div>
                <div className="font-medium">{p.route}</div>
                <div className="text-xs text-muted-foreground">
                  {outgoing ? "Paid to" : "Received from"} ···{" "}
                  {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-display text-lg font-bold ${outgoing ? "text-destructive" : "text-green-500"}`}
                >
                  {outgoing ? "-" : "+"}R{p.amount}
                </div>
                <div className="text-[10px] uppercase text-muted-foreground">{p.status}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
