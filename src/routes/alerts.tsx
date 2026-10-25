import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronRight, ShieldCheck, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppShell, TierBadge } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { useData } from "@/lib/store";
import { comparePeriods, SHARP_DROP, tierAction } from "@/lib/scoring";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Early warnings — Trinova Vendor Scorecard" },
      { name: "description", content: "Vendors that are at risk or falling in performance." },
      { property: "og:title", content: "Early warnings — Trinova Vendor Scorecard" },
      {
        property: "og:description",
        content: "Vendors that are at risk or falling in performance.",
      },
    ],
  }),
  component: Alerts,
});

function Alerts() {
  const data = useData();
  const alerts = data.vendors
    .filter((v) => !v.archived)
    .flatMap((v) => {
      const js = data.jobs.filter((j) => j.vendorId === v.id);
      const { current: recent, previous: prev } = comparePeriods(js, 60);
      const lines: string[] = [];
      const atRisk = recent.tier === "at-risk";
      if (atRisk) lines.push(`Score ${recent.overall} in the last 60 days is below 85.`);
      const drop = prev.jobs && recent.jobs ? prev.overall - recent.overall : 0;
      if (drop >= SHARP_DROP)
        lines.push(
          `Dropped ${drop.toFixed(1)} points (from ${prev.overall} to ${recent.overall}).`,
        );
      if (!lines.length) return [];
      return [
        {
          v,
          recent,
          kind: atRisk ? ("risk" as const) : ("drop" as const),
          text: lines.join(" "),
          drop,
        },
      ];
    })
    .sort((x, y) =>
      x.kind === y.kind ? x.recent.overall - y.recent.overall : x.kind === "risk" ? -1 : 1,
    );
  const risk = alerts.filter((a) => a.kind === "risk").length;
  return (
    <AppShell
      title="Early warnings"
      subtitle="Last 60 days compared with the 60 days before. Review these vendors first."
    >
      <div className="mb-5 grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-2xl border border-destructive/25 bg-destructive/[0.05] p-4">
          <p className="num font-display text-2xl font-bold text-destructive">{risk}</p>
          <p className="text-xs font-medium text-muted-foreground">At-risk vendors</p>
        </div>
        <div className="rounded-2xl border border-warning/40 bg-warning/[0.08] p-4">
          <p className="num font-display text-2xl font-bold">
            {alerts.filter((a) => a.drop >= SHARP_DROP).length}
          </p>
          <p className="text-xs font-medium text-muted-foreground">Sharp falls</p>
        </div>
      </div>
      <div className="max-w-3xl space-y-3">
        {alerts.map((a) => (
          <Link key={a.v.id} to="/vendors/$id" params={{ id: a.v.id }} className="group block">
            <Card className="relative overflow-hidden transition group-hover:shadow-float">
              <span
                className={cn(
                  "absolute inset-y-0 left-0 w-1",
                  a.kind === "risk" ? "bg-destructive" : "bg-warning",
                )}
              />
              <CardContent className="flex items-start gap-4 p-4 pl-5 sm:p-5 sm:pl-6">
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    a.kind === "risk"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-warning/15 text-warning-foreground",
                  )}
                >
                  {a.kind === "risk" ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <TrendingDown className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold group-hover:text-accent">{a.v.name}</p>
                    <TierBadge tier={a.recent.tier} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{a.text}</p>
                  {a.kind === "risk" && (
                    <p className="mt-2 text-xs font-medium text-destructive">
                      {tierAction["at-risk"]}
                    </p>
                  )}
                </div>
                <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
        {alerts.length === 0 && (
          <div className="rounded-2xl border border-dashed py-14 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-success" />
            <p className="mt-3 font-medium">All clear</p>
            <p className="text-sm text-muted-foreground">
              No vendors are at risk or falling right now.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
