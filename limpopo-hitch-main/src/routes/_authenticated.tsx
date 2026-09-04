import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;

    // Check for JWT token — the real auth guard
    const token = localStorage.getItem("hitch_token");
    if (!token) {
      throw redirect({ to: "/auth" });
    }
  },
  component: AppShell,
});
