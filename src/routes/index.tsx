import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Timer, BellRing } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trinova Analytics — Vendor Performance Scorecard" },
      {
        name: "description",
        content:
          "Score vendors on on-time-in-full delivery, safety and HSE compliance, and get early warnings before they fail.",
      },
      { property: "og:title", content: "Trinova Analytics — Vendor Performance Scorecard" },
      {
        property: "og:description",
        content:
          "From gut feel to data: automated vendor scorecards and early warnings for oil and gas servicing companies.",
      },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: Timer,
    title: "On-time, in-full",
    text: "Every job is checked for timely and complete delivery.",
  },
  {
    icon: ShieldCheck,
    title: "Safety & HSE",
    text: "Incidents and HSE compliance count toward each score.",
  },
  {
    icon: BellRing,
    title: "Early warnings",
    text: "See which vendors are slipping before it costs you.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-hero text-primary-foreground">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <p className="font-display text-xl font-bold">
          Trinova<span className="text-accent">.</span>
        </p>
        <section className="py-20 md:py-28">
          <p className="text-sm uppercase tracking-widest opacity-80">
            Turning data into decisions
          </p>
          <h1 className="mt-4 font-display text-4xl md:text-6xl font-bold leading-tight max-w-3xl">
            Know which vendors deliver — and which don't.
          </h1>
          <p className="mt-6 max-w-xl text-lg opacity-85">
            An automated vendor scorecard and early-warning system built for oil and gas servicing
            companies.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-10">
            <Link to="/dashboard">Open the scoreboard</Link>
          </Button>
        </section>
        <section className="grid gap-4 md:grid-cols-3 pb-16">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl bg-card/10 p-6 backdrop-blur border border-primary-foreground/15"
            >
              <f.icon className="h-6 w-6 text-accent" />
              <h3 className="mt-3 font-display font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm opacity-80">{f.text}</p>
            </div>
          ))}
        </section>
        <section className="pb-20">
          <h2 className="font-display text-2xl font-bold">How scores work</h2>
          <p className="mt-2 max-w-2xl opacity-85">
            Every job a vendor completes is logged. A job only passes on-time-in-full (OTIF) if it
            arrives on time <em>and</em> complete.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-card/10 p-6 border border-primary-foreground/15">
              <p className="text-sm uppercase tracking-widest opacity-70">Overall score</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <span className="font-display text-lg font-bold text-accent">50%</span>{" "}
                  On-time-in-full delivery
                </li>
                <li>
                  <span className="font-display text-lg font-bold text-accent">30%</span> Damage and
                  incident-free jobs
                </li>
                <li>
                  <span className="font-display text-lg font-bold text-accent">20%</span> HSE
                  compliance (PPE, procedures)
                </li>
              </ul>
            </div>
            <div className="rounded-xl bg-card/10 p-6 border border-primary-foreground/15">
              <p className="text-sm uppercase tracking-widest opacity-70">
                Tiers and automatic actions
              </p>
              <ul className="mt-3 space-y-3 text-sm">
                <li>
                  <span className="rounded-full bg-success px-2 py-0.5 text-xs font-semibold text-success-foreground">
                    Elite · 95+
                  </span>{" "}
                  <span className="opacity-85">Bonus and priority job allocation.</span>
                </li>
                <li>
                  <span className="rounded-full bg-warning px-2 py-0.5 text-xs font-semibold text-warning-foreground">
                    Standard · 85–94
                  </span>{" "}
                  <span className="opacity-85">Normal operation, standard monitoring.</span>
                </li>
                <li>
                  <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">
                    At-Risk · below 85
                  </span>{" "}
                  <span className="opacity-85">
                    Warning, high-value jobs held, review and corrective action plan.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>
        <footer className="border-t border-primary-foreground/15 py-6 text-sm opacity-70">
          © {new Date().getFullYear()} Trinova Analytics Limited · Port Harcourt &amp; Lagos,
          Nigeria
        </footer>
      </div>
    </div>
  );
}
