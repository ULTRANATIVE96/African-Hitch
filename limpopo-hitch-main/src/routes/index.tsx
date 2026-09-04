import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, MapPin, Users, Wallet, Mountain } from "lucide-react";
import heroImg from "@/assets/hero-limpopo.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Limpopo Hike Connect — Safer rides across the provinces" },
      {
        name: "description",
        content:
          "Connect with trusted drivers and travelers across Limpopo and South Africa. Post rides, request hikes, hold each other accountable.",
      },
      { property: "og:title", content: "Limpopo Hike Connect" },
      {
        property: "og:description",
        content: "Connect with trusted drivers and travelers across Limpopo and South Africa.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="absolute left-0 right-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2 text-background">
            <Mountain className="h-5 w-5" />
            <span className="font-display text-lg font-bold tracking-tight">HikeConnect</span>
          </div>
          <Link
            to="/auth"
            className="rounded-full bg-background/95 px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-background"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="relative isolate overflow-hidden">
        <img
          src={heroImg}
          alt="A bakkie traveling a dusty Limpopo road at sunset, baobab trees in the distance"
          width={1600}
          height={1200}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/40 to-foreground/85" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-3xl flex-col justify-end px-5 pb-12 pt-32 text-background">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-background/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-accent" /> Built for Limpopo travelers
          </span>
          <h1 className="font-display text-5xl font-bold leading-[0.95] sm:text-6xl">
            Safer hikes,
            <br />
            <span className="text-ochre">across the provinces.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-background/85">
            Post where you're going. Find a driver or a hiker going the same way. Agree on the price
            and pickup point — and hold each other to it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth"
              search={{ role: "hiker" as const }}
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-lg transition hover:brightness-110"
            >
              I need a hike
            </Link>
            <Link
              to="/auth"
              search={{ role: "driver" as const }}
              className="rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-lg transition hover:bg-background/90"
            >
              I'm driving
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20">
        <h2 className="font-display text-3xl font-bold sm:text-4xl">How it works</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Two sides, one trusted network. Whether you're behind the wheel or looking for a lift —
          the flow is the same.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: MapPin,
              title: "Post your trip",
              body: "Drivers post a route, date and seats. Hikers post where they need to be and when.",
            },
            {
              icon: Users,
              title: "Match & agree",
              body: "Send a request. Agree on the price per seat, luggage and any specials up front.",
            },
            {
              icon: Wallet,
              title: "Pay & record",
              body: "Pickup point shared on the map. Every payment is logged in case something goes wrong.",
            },
            {
              icon: ShieldCheck,
              title: "Hold each other true",
              body: "Dropped at the wrong place? Passenger didn't show? Flag them to the community red list.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <div className="grid items-center gap-8 sm:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Accountability you can see.
              </h2>
              <p className="mt-3 max-w-xl text-primary-foreground/85">
                Every driver and hiker has a public profile and rating. The red list shows who has
                broken agreements — so the village can travel safer.
              </p>
            </div>
            <Link
              to="/auth"
              className="justify-self-start rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-lg sm:justify-self-end"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Limpopo Hike Connect</span>
          <span className="text-xs">
            Created by{" "}
            <a
              href="http://dac-technologies.co.za/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline hover:text-primary/80 transition"
            >
              Dac-Technology
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
