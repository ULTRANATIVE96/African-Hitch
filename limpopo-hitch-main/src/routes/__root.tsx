import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { isAuthenticated } from "@/lib/api-client";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Root router caught error:", error);
  const router = useRouter();

  const handleReLogin = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("hitch_token");
      localStorage.removeItem("hitch_user_id");
      window.location.href = "/auth";
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>

        {error?.message && (
          <div className="mt-3 rounded-lg bg-destructive/10 p-2 text-xs font-mono text-destructive text-left overflow-auto max-h-24 border border-destructive/20">
            {error.message}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
          >
            Try again
          </button>
          <button
            onClick={handleReLogin}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent cursor-pointer"
          >
            Sign in again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "African Hitch & Lift Connect | Rides, Hitching & Transport Across Africa" },
      {
        name: "description",
        content:
          "Need a ride, lift, or transport in Africa? African Hitch Connect is the trusted platform for safe hitching, ridesharing, and provincial lifts across Limpopo, South Africa, and Africa. Connect with verified drivers and passengers today.",
      },
      {
        name: "keywords",
        content:
          "hitching, lift, ride, transport needed, lift needed, ride needed, hitching africa, african hitch, ride sharing africa, carpool south africa, transport limpopo, african rides, lifts across provinces, hitchhikers africa, travel africa, african transport, safe hitching, hitch connect, hitching lift, lift needed south africa, african rideshare",
      },
      { name: "author", content: "DAC Technology — African Hitch & Lift Connect" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:site_name", content: "African Hitch & Lift Connect" },
      { property: "og:title", content: "African Hitch & Lift Connect — Rides, Hitching & Transport Across Africa" },
      {
        property: "og:description",
        content:
          "Looking for a lift or transport in Africa? Connect with trusted drivers and travelers. Safe hitching, shared rides, and real-time trip tracking across Africa.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_ZA" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "African Hitch & Lift Connect — Safe Rides & Transport in Africa" },
      {
        name: "twitter:description",
        content:
          "Need a ride, lift, or transport in Africa? Join African Hitch Connect for safe hitching and trusted rides across the provinces.",
      },
      { name: "application-name", content: "African Hitch Connect" },
      { name: "geo.region", content: "ZA-LP" },
      { name: "geo.placename", content: "Limpopo, South Africa, Africa" },
    ],
    links: [
      { rel: "canonical", href: "https://hitchconnect.co.za" },
      { rel: "manifest", href: "/manifest.json" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "African Hitch & Lift Connect",
          "alternateName": ["African Hitch", "HikeConnect", "Limpopo Hitch Connect"],
          "url": "https://hitchconnect.co.za",
          "description": "Safe hitching, lifts, rides, and reliable transport across Limpopo, South Africa, and Africa. Connects drivers offering rides with travelers needing transport.",
          "applicationCategory": "TravelApplication",
          "operatingSystem": "All",
          "areaServed": [
            { "@type": "AdministrativeArea", "name": "Limpopo" },
            { "@type": "Country", "name": "South Africa" },
            { "@type": "Continent", "name": "Africa" }
          ],
          "keywords": "hitching, lift, ride, transport needed, lift needed, ride needed, hitching africa, african hitch, ride sharing africa",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "ZAR"
          }
        }),
      },
      {
        src: "https://accounts.google.com/gsi/client",
        async: true,
        defer: true,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(console.error);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
