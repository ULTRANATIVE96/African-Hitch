import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, MapPin, Users, Wallet, Mountain } from "lucide-react";
import heroImg from "@/assets/hero-limpopo.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "African Hitch & Lift Connect — Rides, Hitching & Transport Across Africa" },
      {
        name: "description",
        content:
          "Need a lift, ride, or transport in Africa? African Hitch Connect is the premier platform for safe hitching, provincial ridesharing, and community transport across Limpopo and South Africa.",
      },
      {
        name: "keywords",
        content:
          "hitching, lift, ride, transport needed, lift needed, ride needed, hitching africa, african hitch, ride sharing africa, carpool south africa, transport limpopo, african rides, lifts across provinces, hitchhikers africa, travel africa, african transport, safe hitching, hitch connect",
      },
      { property: "og:title", content: "African Hitch & Lift Connect — Safe Rides & Transport in Africa" },
      {
        property: "og:description",
        content:
          "Need a ride, lift, or transport in Africa? Find trusted drivers, share trips, and travel safely across South African provinces.",
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
            <Mountain className="h-5 w-5 text-amber-400" />
            <span className="font-display text-lg font-bold tracking-tight">African Hitch Connect</span>
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
          alt="African travel road across Limpopo at sunset with vehicles and travelers"
          width={1600}
          height={1200}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 via-foreground/45 to-foreground/90" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-3xl flex-col justify-end px-5 pb-12 pt-32 text-background">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-background/15 px-3.5 py-1 text-xs font-semibold backdrop-blur border border-white/20">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /> 
            African Hitch & Lift Network • South Africa
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.05] sm:text-6xl">
            Safer hitching, lifts &amp; rides
            <br />
            <span className="text-ochre">across African provinces.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-background/85 leading-relaxed">
            Need a ride or transport in Africa? Post where you're going, find a verified driver or traveler heading the same way, agree on seat fees, and travel with peace of mind.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/auth"
              search={{ role: "hiker" as const }}
              className="rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground shadow-lg transition hover:brightness-110 flex items-center gap-2"
            >
              <span>🧳</span> Lift / Ride Needed
            </Link>
            <Link
              to="/auth"
              search={{ role: "driver" as const }}
              className="rounded-full bg-background px-6 py-3.5 text-sm font-bold text-foreground shadow-lg transition hover:bg-background/90 flex items-center gap-2"
            >
              <span>🚐</span> Offering a Ride / Lift
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works - SEO Content */}
      <section className="mx-auto max-w-5xl px-5 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Community Ridesharing</span>
          <h2 className="font-display text-3xl font-bold sm:text-4xl mt-1">How African Hitch Connect Works</h2>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">
            Whether you need transport, a quick lift to the next town, or have empty seats in your car — our trusted network connects drivers and travelers across Africa.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: MapPin,
              title: "Post Trips & Lifts Needed",
              body: "Drivers post departure times, routes, and available seats. Travelers post where they need transport and when.",
            },
            {
              icon: Users,
              title: "Connect & Agree on Fees",
              body: "Send a hitch or ride request. Agree on the price per seat, luggage space, and pickup points transparently.",
            },
            {
              icon: Wallet,
              title: "Shared Route & Payments",
              body: "Exact pickup locations shared on live maps. Digital payment receipts are recorded to ensure mutual accountability.",
            },
            {
              icon: ShieldCheck,
              title: "Community Safety Red List",
              body: "Real-time safety flags and ratings keep everyone honest. Breached agreements are flagged publicly to protect African travelers.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border bg-card p-5 shadow-xs hover:border-primary/40 transition">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-base font-bold">{title}</h3>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Transport & Hitching Routes in Africa */}
      <section className="bg-secondary/40 border-y py-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="max-w-xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">High-Demand Travel</span>
            <h2 className="font-display text-2xl font-bold sm:text-3xl mt-1">
              Popular Hitching &amp; Transport Routes
            </h2>
            <p className="text-xs text-muted-foreground mt-1.5">
              Find daily lifts and shared rides between major hubs across Limpopo and neighboring provinces.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
            {[
              "Polokwane ↔ Johannesburg",
              "Thohoyandou ↔ Polokwane",
              "Tzaneen ↔ Pretoria",
              "Mokopane ↔ Polokwane",
              "Giyani ↔ Thohoyandou",
              "Louis Trichardt ↔ Musina",
              "Phalaborwa ↔ Tzaneen",
              "Bela-Bela ↔ Pretoria",
            ].map((route) => (
              <Link
                key={route}
                to="/auth"
                className="rounded-xl border bg-card p-3 font-semibold text-foreground/90 hover:border-primary hover:text-primary transition flex items-center justify-between shadow-2xs"
              >
                <span>{route}</span>
                <span className="text-primary font-bold">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Safety & Accountability Banner */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <div className="grid items-center gap-8 sm:grid-cols-[1fr_auto]">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Safe Hitching &amp; Trusted African Transport
              </h2>
              <p className="mt-3 max-w-xl text-primary-foreground/85 text-sm sm:text-base leading-relaxed">
                Every driver and passenger has a verified profile, community ratings, and ride history. We eliminate the uncertainty of hitching by making rides accountable.
              </p>
            </div>
            <Link
              to="/auth"
              className="justify-self-start rounded-full bg-accent px-6 py-3.5 text-sm font-bold text-accent-foreground shadow-lg transition hover:brightness-110 sm:justify-self-end"
            >
              Find a Lift or Offer a Ride
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-5 py-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} African Hitch &amp; Lift Connect</span>
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
