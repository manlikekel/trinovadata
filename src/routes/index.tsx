import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, BellRing, Download, ShieldCheck, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/app/Brand";
import { useInstallAction } from "@/components/app/InstallPrompt";
import { ScoreRing } from "@/components/app/ScoreRing";
import { initPwa } from "@/lib/pwa";
import type { Tier } from "@/lib/scoring";

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
    text: "Every job is checked for timely and complete delivery. Late or short means fail.",
  },
  {
    icon: ShieldCheck,
    title: "Safety & HSE",
    text: "Incidents, damage and HSE compliance count toward each vendor’s score.",
  },
  {
    icon: BellRing,
    title: "Early warnings",
    text: "See which vendors are slipping before it costs you a job or an incident.",
  },
];

const preview: { name: string; code: string; score: number; tier: Tier }[] = [
  { name: "Deltaline Drilling", code: "VN-104", score: 99, tier: "elite" },
  { name: "SwiftRide Dispatch", code: "VN-212", score: 90, tier: "standard" },
  { name: "Bonny Marine Logistics", code: "VN-089", score: 69, tier: "at-risk" },
];

const tiers = [
  {
    label: "Elite",
    range: "95+",
    text: "Bonus and priority job allocation.",
    cls: "bg-success text-success-foreground",
  },
  {
    label: "Standard",
    range: "85–94",
    text: "Normal operation, standard monitoring.",
    cls: "bg-warning text-warning-foreground",
  },
  {
    label: "At-Risk",
    range: "< 85",
    text: "Warning, high-value jobs held, review and corrective action plan.",
    cls: "bg-destructive text-destructive-foreground",
  },
];

function Index() {
  const install = useInstallAction();
  useEffect(() => initPwa(), []);

  return (
    <div className="min-h-dvh bg-hero text-primary-foreground">
      <div className="pt-safe mx-auto max-w-6xl px-5 sm:px-8">
        <header className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <BrandMark className="h-10 w-10 rounded-[11px] ring-1 ring-white/15" />
            <div className="leading-tight">
              <p className="font-display text-[15px] font-bold">Trinova Analytics</p>
              <p className="text-[11px] uppercase tracking-[0.16em] opacity-60">
                Turning data into decisions
              </p>
            </div>
          </div>
          {install.available && (
            <Button
              variant="ghost"
              size="sm"
              onClick={install.run}
              className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
            >
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Install app</span>
            </Button>
          )}
        </header>

        <section className="grid items-center gap-12 py-12 md:py-20 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/15 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Built for oil & gas servicing
              companies
            </p>
            <h1 className="mt-6 text-[40px] font-bold leading-[1.05] sm:text-5xl lg:text-[64px]">
              Know which vendors deliver <span className="text-accent">— and which don’t.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed opacity-80 sm:text-lg">
              An automated vendor scorecard and early-warning system. Log jobs, get objective
              scores, and act before weak vendors cost you.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-accent px-6 text-base text-accent-foreground hover:bg-accent/90"
              >
                <Link to="/dashboard">
                  Open the scoreboard <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {install.available && (
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={install.run}
                  className="h-12 rounded-xl px-6 text-base text-primary-foreground ring-1 ring-white/25 hover:bg-white/10 hover:text-primary-foreground"
                >
                  <Download className="h-4 w-4" /> Install on this device
                </Button>
              )}
            </div>
          </div>

          {/* App preview */}
          <div className="relative mx-auto w-full max-w-md">
            <div
              className="absolute -inset-6 rounded-[2.5rem] bg-accent/20 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative rounded-3xl bg-card p-5 text-card-foreground shadow-2xl ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <p className="font-display font-semibold">Scoreboard</p>
                <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  Last 90 days
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-muted/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Average OTIF</p>
                  <p className="num font-display text-xl font-bold">94.2%</p>
                </div>
                <div className="rounded-2xl bg-destructive/[0.07] p-3">
                  <p className="text-[11px] text-muted-foreground">At-risk</p>
                  <p className="num font-display text-xl font-bold text-destructive">1</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {preview.map((p) => (
                  <div key={p.code} className="flex items-center gap-3 rounded-2xl border p-2.5">
                    <ScoreRing score={p.score} tier={p.tier} size={44} stroke={5} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-16 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/12 backdrop-blur"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/20">
                <f.icon className="h-5 w-5 text-accent" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed opacity-75">{f.text}</p>
            </div>
          ))}
        </section>

        <section className="pb-20">
          <h2 className="text-3xl font-bold">How scores work</h2>
          <p className="mt-2 max-w-2xl opacity-75">
            Every job is logged. A job only passes on-time-in-full (OTIF) if it arrives on time{" "}
            <em>and</em> complete.
          </p>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/12">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">
                Overall score
              </p>
              <div className="mt-5 space-y-4">
                {[
                  ["50%", "On-time-in-full delivery", 50],
                  ["30%", "Damage and incident-free jobs", 30],
                  ["20%", "HSE compliance (PPE, procedures)", 20],
                ].map(([w, l, n]) => (
                  <div key={l as string}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span>{l}</span>
                      <span className="num font-display text-lg font-bold text-accent">{w}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{ width: `${(n as number) * 2}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.06] p-6 ring-1 ring-white/12">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">
                Tiers and automatic actions
              </p>
              <ul className="mt-5 space-y-4">
                {tiers.map((t) => (
                  <li key={t.label} className="flex items-start gap-3 text-sm">
                    <span
                      className={`num shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.cls}`}
                    >
                      {t.label} · {t.range}
                    </span>
                    <span className="opacity-80">{t.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <footer className="pb-safe flex flex-col gap-2 border-t border-white/10 py-6 text-sm opacity-60 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Trinova Analytics Limited</span>
          <span>Port Harcourt &amp; Lagos, Nigeria</span>
        </footer>
      </div>
      {install.dialog}
    </div>
  );
}
