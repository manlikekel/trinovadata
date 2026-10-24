import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, TrendingDown } from "lucide-react";
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
      const out = [];
      if (recent.tier === "at-risk")
        out.push({
          v,
          recent,
          kind: "risk" as const,
          text: `Score ${recent.overall} in the last 60 days is below 85.`,
        });
      if (prev.jobs && recent.jobs && prev.overall - recent.overall >= SHARP_DROP)
        out.push({
          v,
          recent,
          kind: "drop" as const,
          text: `Score dropped ${(prev.overall - recent.overall).toFixed(1)} points (from ${prev.overall} to ${recent.overall}).`,
        });
      return out;
    });
  return (
    <AppShell title="Early warnings">
      <p className="-mt-3 mb-6 text-sm text-muted-foreground">
        Based on the last 60 days compared with the 60 days before.
      </p>
      <div className="space-y-3 max-w-3xl">
        {alerts.map((a, i) => (
          <Card key={i} className={a.kind === "risk" ? "border-destructive" : "border-warning"}>
            <CardContent className="p-4 flex gap-4 items-start">
              {a.kind === "risk" ? (
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              ) : (
                <TrendingDown className="h-5 w-5 text-warning mt-0.5" />
              )}
              <div className="flex-1">
                <Link
                  to="/vendors/$id"
                  params={{ id: a.v.id }}
                  className="font-semibold hover:text-accent"
                >
                  {a.v.name}
                </Link>
                <p className="text-sm text-muted-foreground">{a.text}</p>
                {a.kind === "risk" && (
                  <p className="mt-1 text-xs font-medium text-destructive">
                    {tierAction["at-risk"]}
                  </p>
                )}
              </div>
              <TierBadge tier={a.recent.tier} />
            </CardContent>
          </Card>
        ))}
        {alerts.length === 0 && (
          <p className="text-muted-foreground">No warnings right now — all vendors are on track.</p>
        )}
      </div>
    </AppShell>
  );
}
