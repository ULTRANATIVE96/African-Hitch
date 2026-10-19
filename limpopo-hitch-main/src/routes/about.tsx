import { createFileRoute, Link } from "@tanstack/react-router";
import { Mountain, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — HikeConnect" },
      { name: "description", content: "About HikeConnect, a ridesharing and hitching platform for Limpopo commuters." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-[#faf7f0] dark:bg-background px-5 py-10">
      <div className="mx-auto max-w-xl">
        <Link
          to="/auth"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Link>

        <div className="mt-6 flex items-center gap-2">
          <Mountain className="h-5 w-5 text-primary" />
          <h1 className="font-display text-xl font-bold text-foreground">About HikeConnect</h1>
        </div>

        <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
          HikeConnect is a ridesharing and hitching platform for commuters travelling between towns in Limpopo and
          neighbouring provinces. Drivers post trips with empty seats, hikers request lifts, and both sides agree on
          seat fees up front. Live GPS sharing, verified accounts and a community red list help keep every trip
          accountable.
        </p>

        <h2 className="mt-8 text-xs font-bold uppercase tracking-wider text-muted-foreground">Credits</h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          Designed and developed by Nhlayiseko Divine Hlungwani (Bungeni, Limpopo) in collaboration with
          DAC-Technologies.
        </p>

        <dl className="mt-5 grid gap-x-6 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-2">
          <div className="sm:col-span-2 mt-1 font-semibold text-foreground/80">Developer</div>
          <div>Nhlayiseko Divine Hlungwani</div>
          <div>Bungeni · Black Tsonga</div>
          <div>
            Phone: <a href="tel:0761824735" className="hover:text-foreground hover:underline">076 182 4735</a>
          </div>
          <div>
            WhatsApp:{" "}
            <a href="https://wa.me/27697861032" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">
              069 786 1032
            </a>
          </div>
          <div>
            <a href="mailto:hlayisekohh7@gmail.com" className="hover:text-foreground hover:underline">hlayisekohh7@gmail.com</a>
          </div>
          <div>
            <a href="https://divine-folio.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">
              divine-folio.vercel.app
            </a>
          </div>

          <div className="sm:col-span-2 mt-4 font-semibold text-foreground/80">DAC-Technologies</div>
          <div>Mpumalanga</div>
          <div>
            Phone: <a href="tel:0604645849" className="hover:text-foreground hover:underline">060 464 5849</a>
          </div>
          <div>
            <a href="mailto:info@dac-technologies.co.za" className="hover:text-foreground hover:underline">info@dac-technologies.co.za</a>
          </div>
          <div>
            <a href="https://dac-technologies.co.za" target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">
              dac-technologies.co.za
            </a>
          </div>
        </dl>

        <p className="mt-10 text-[10px] text-muted-foreground/60">© {new Date().getFullYear()} HikeConnect</p>
      </div>
    </div>
  );
}
