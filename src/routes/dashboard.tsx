import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, TierBadge, pct } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadCsv, useData } from "@/lib/store";
import { comparePeriods, scoreJobs, tierLabel, type Tier } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Award,
  Download,
  Search,
  ShieldCheck,
  Star,
  Timer,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Scoreboard — Trinova Vendor Scorecard" },
      {
        name: "description",
        content: "Ranked vendor performance with OTIF, safety and HSE scores.",
      },
      { property: "og:title", content: "Scoreboard — Trinova Vendor Scorecard" },
      {
        property: "og:description",
        content: "Ranked vendor performance with OTIF, safety and HSE scores.",
      },
    ],
  }),
  component: Dashboard,
});

const ranges = {
  "30": "Last 30 days",
  "90": "Last 90 days",
  "365": "Last 12 months",
  all: "All time",
};

function Delta({ value, goodWhenUp = true }: { value: number | null; goodWhenUp?: boolean }) {
  if (value === null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  const good = up === goodWhenUp || Math.abs(value) < 0.05;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
        good ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
      )}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(value).toFixed(1)}
    </span>
  );
}

function Dashboard() {
  const data = useData();
  const [range, setRange] = useState("90");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const all = useMemo(() => {
    const days = range === "all" ? null : Number(range);
    return data.vendors
      .filter((v) => !v.archived && (cat === "all" || v.categoryId === cat))
      .map((v) => {
        const js = data.jobs.filter((j) => j.vendorId === v.id);
        if (days === null) return { v, s: scoreJobs(js), prev: null };
        const { current, previous } = comparePeriods(js, days);
        return { v, s: current, prev: previous };
      })
      .sort((a, b) => b.s.overall - a.s.overall);
  }, [data, range, cat]);

  const needle = q.trim().toLowerCase();
  const rows = all.filter(
    (r) =>
      (status === "all" || r.s.tier === (status as Tier)) &&
      (!needle ||
        r.v.name.toLowerCase().includes(needle) ||
        r.v.code.toLowerCase().includes(needle)),
  );

  const scored = all.filter((r) => r.s.jobs > 0);
  const prevScored = all.filter((r) => r.prev && r.prev.jobs > 0);
  const avg = (list: typeof all, k: "otif" | "safety", prev = false) => {
    const vals = list.map((r) => (prev ? r.prev! : r.s)[k]);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const delta = (k: "otif" | "safety") =>
    prevScored.length && scored.length ? avg(scored, k) - avg(prevScored, k, true) : null;
  const catName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? "—";
  const top = scored.find((r) => r.s.tier === "elite") ?? scored[0];
  const incidentDelta = delta("safety");

  const cards = [
    {
      label: "Average OTIF",
      value: pct(avg(scored, "otif")),
      hint: "Target ≥ 95%",
      delta: <Delta value={delta("otif")} />,
      icon: Timer,
    },
    {
      label: "Incident rate",
      value: pct(100 - avg(scored, "safety")),
      hint: "Damage / safety incidents",
      delta: <Delta value={incidentDelta === null ? null : -incidentDelta} goodWhenUp={false} />,
      icon: ShieldCheck,
    },
    {
      label: "Top performers",
      value: scored.filter((r) => r.s.tier === "elite").length,
      hint: "Elite · score ≥ 95",
      icon: Award,
    },
    {
      label: "At-risk vendors",
      value: scored.filter((r) => r.s.tier === "at-risk").length,
      hint: "Score < 85 · action required",
      icon: AlertTriangle,
      danger: true,
    },
  ];

  const exportCsv = () =>
    downloadCsv(`trinova-scoreboard-${new Date().toISOString().slice(0, 10)}.csv`, [
      [
        "Rank",
        "Vendor",
        "Vendor ID",
        "Category",
        "Jobs",
        "Late",
        "Incidents",
        "OTIF %",
        "Safety %",
        "HSE %",
        "Avg quality",
        "Score",
        "Tier",
      ],
      ...rows.map(({ v, s }, i) => [
        i + 1,
        v.name,
        v.code,
        catName(v.categoryId),
        s.jobs,
        s.late,
        s.incidents,
        s.otif.toFixed(1),
        s.safety.toFixed(1),
        s.hse.toFixed(1),
        s.quality.toFixed(1),
        s.overall,
        tierLabel[s.tier],
      ]),
    ]);

  return (
    <AppShell
      title="Vendor scoreboard"
      actions={
        <div className="flex flex-wrap gap-2">
          {top && (
            <Button asChild variant="outline">
              <Link to="/vendors/$id" params={{ id: top.v.id }}>
                <Star className="h-4 w-4 text-success" /> Top performer
              </Link>
            </Button>
          )}
          <Button variant="outline" onClick={exportCsv} disabled={!rows.length}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <c.icon className={cn("h-4 w-4", c.danger ? "text-destructive" : "text-accent")} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p
                  className={cn(
                    "font-display text-3xl font-bold",
                    c.danger && Number(c.value) > 0 && "text-destructive",
                  )}
                >
                  {c.value}
                </p>
                {c.delta}
              </div>
              <p className="text-xs text-muted-foreground">{c.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {range !== "all" && (
        <p className="-mt-3 mb-6 text-xs text-muted-foreground">
          Arrows compare with the previous{" "}
          {ranges[range as keyof typeof ranges].toLowerCase().replace("last ", "")}.
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vendor name or ID"
            className="pl-9 bg-card"
          />
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-44 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ranges).map(([k, l]) => (
              <SelectItem key={k} value={k}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-52 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {data.categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="elite">Elite</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="at-risk">At-Risk</SelectItem>
            <SelectItem value="none">No data</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Jobs</TableHead>
                <TableHead className="text-right">OTIF</TableHead>
                <TableHead className="text-right">Safety</TableHead>
                <TableHead className="text-right">HSE</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ v, s, prev }, i) => (
                <TableRow
                  key={v.id}
                  className={s.tier === "at-risk" ? "bg-destructive/5" : undefined}
                >
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <TierBadge tier={s.tier} />
                  </TableCell>
                  <TableCell>
                    <Link
                      to="/vendors/$id"
                      params={{ id: v.id }}
                      className="font-semibold hover:text-accent"
                    >
                      {v.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{v.code}</p>
                  </TableCell>
                  <TableCell className="text-sm">{catName(v.categoryId)}</TableCell>
                  <TableCell className="text-right">{s.jobs}</TableCell>
                  <TableCell className="text-right">
                    {pct(s.otif)}
                    <p className="text-xs text-muted-foreground">{s.late} late</p>
                  </TableCell>
                  <TableCell className="text-right">
                    {pct(s.safety)}
                    <p className="text-xs text-muted-foreground">{s.incidents} incidents</p>
                  </TableCell>
                  <TableCell className="text-right">{pct(s.hse)}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-display font-bold">{s.jobs ? s.overall : "—"}</span>
                    {prev && prev.jobs > 0 && s.jobs > 0 && (
                      <div>
                        <Delta value={s.overall - prev.overall} />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    No vendors match.{" "}
                    <Link to="/vendors" className="text-accent underline">
                      Add a vendor
                    </Link>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
