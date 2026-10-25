import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Award,
  ChevronRight,
  Download,
  Loader2,
  Search,
  ShieldCheck,
  Star,
  Timer,
} from "lucide-react";
import { AppShell, TierBadge, pct } from "@/components/AppShell";
import { ScoreRing } from "@/components/app/ScoreRing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { downloadCsv, loadDemoData, useData } from "@/lib/store";
import { comparePeriods, scoreJobs, tierLabel, type Tier } from "@/lib/scoring";
import { cn } from "@/lib/utils";

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

export function Delta({
  value,
  goodWhenUp = true,
}: {
  value: number | null;
  goodWhenUp?: boolean;
}) {
  if (value === null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  const good = up === goodWhenUp || Math.abs(value) < 0.05;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
        good ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive",
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
  const count = (t: Tier) => scored.filter((r) => r.s.tier === t).length;

  const cards = [
    {
      label: "Average OTIF",
      value: pct(avg(scored, "otif")),
      hint: "Target ≥ 95%",
      delta: <Delta value={delta("otif")} />,
      icon: Timer,
      tone: "text-accent bg-accent/10",
    },
    {
      label: "Incident rate",
      value: pct(100 - avg(scored, "safety")),
      hint: "Damage & safety",
      delta: <Delta value={incidentDelta === null ? null : -incidentDelta} goodWhenUp={false} />,
      icon: ShieldCheck,
      tone: "text-primary bg-primary/8",
    },
    {
      label: "Top performers",
      value: count("elite"),
      hint: "Elite · score ≥ 95",
      icon: Award,
      tone: "text-success bg-success/12",
    },
    {
      label: "At-risk vendors",
      value: count("at-risk"),
      hint: "Score < 85 · act now",
      icon: AlertTriangle,
      tone: "text-destructive bg-destructive/10",
      danger: count("at-risk") > 0,
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
      title="Scoreboard"
      subtitle={
        <>
          Vendors ranked by overall score · {ranges[range as keyof typeof ranges]}
          {range !== "all" && ", arrows vs the period before"}
        </>
      }
      actions={
        <>
          {top && (
            <Button asChild variant="outline" className="bg-card">
              <Link to="/vendors/$id" params={{ id: top.v.id }}>
                <Star className="h-4 w-4 fill-warning text-warning" /> Top performer
              </Link>
            </Button>
          )}
          <Button variant="outline" className="bg-card" onClick={exportCsv} disabled={!rows.length}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className={cn(c.danger && "border-destructive/30")}>
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-muted-foreground">{c.label}</p>
                <span className={cn("grid h-8 w-8 place-items-center rounded-lg", c.tone)}>
                  <c.icon className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <p
                  className={cn(
                    "num font-display text-[26px] font-bold leading-none sm:text-[30px]",
                    c.danger && "text-destructive",
                  )}
                >
                  {c.value}
                </p>
                {c.delta}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{c.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {scored.length > 0 && (
        <Card className="mt-3 sm:mt-4">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
            <p className="shrink-0 text-[13px] font-semibold">Vendor health</p>
            <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              {(["elite", "standard", "at-risk"] as const).map((t) => (
                <div
                  key={t}
                  className={cn(
                    "h-full transition-all",
                    t === "elite"
                      ? "bg-success"
                      : t === "standard"
                        ? "bg-warning"
                        : "bg-destructive",
                  )}
                  style={{ width: `${(count(t) / scored.length) * 100}%` }}
                />
              ))}
            </div>
            <div className="flex shrink-0 gap-4 text-xs text-muted-foreground">
              {(["elite", "standard", "at-risk"] as const).map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      t === "elite"
                        ? "bg-success"
                        : t === "standard"
                          ? "bg-warning"
                          : "bg-destructive",
                    )}
                  />
                  <span className="num font-semibold text-foreground">{count(t)}</span>{" "}
                  {tierLabel[t]}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 mt-8 grid grid-cols-2 gap-2 sm:gap-3 md:flex md:flex-wrap md:items-center">
        <div className="relative col-span-2 md:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vendor name or ID"
            className="h-11 rounded-xl bg-card pl-10 md:h-10"
          />
        </div>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="col-span-2 h-11 rounded-xl bg-card md:h-10 md:w-52">
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
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="h-11 rounded-xl bg-card md:h-10 md:w-40">
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
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11 rounded-xl bg-card md:h-10 md:w-40">
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
        <p className="col-span-2 text-xs text-muted-foreground md:ml-auto">
          {rows.length} of {all.length} vendors
        </p>
      </div>

      {/* Phone: cards */}
      <div className="space-y-3 md:hidden">
        {rows.map(({ v, s, prev }, i) => (
          <Link key={v.id} to="/vendors/$id" params={{ id: v.id }} className="block">
            <Card
              className={cn(
                "transition active:scale-[0.99]",
                s.tier === "at-risk" && "border-destructive/30",
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ScoreRing score={s.jobs ? s.overall : null} tier={s.tier} size={56} stroke={6} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="num text-xs font-semibold text-muted-foreground">
                        #{i + 1}
                      </span>
                      <TierBadge tier={s.tier} />
                      {prev && prev.jobs > 0 && s.jobs > 0 && (
                        <Delta value={s.overall - prev.overall} />
                      )}
                    </div>
                    <p className="mt-1 truncate font-semibold">{v.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {v.code} · {catName(v.categoryId)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </div>
                <div className="mt-3 grid grid-cols-3 divide-x rounded-xl bg-muted/50 py-2 text-center">
                  {[
                    ["OTIF", s.otif, `${s.late} late`],
                    ["Safety", s.safety, `${s.incidents} inc.`],
                    ["HSE", s.hse, `${s.jobs} jobs`],
                  ].map(([l, val, h]) => (
                    <div key={l as string}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {l}
                      </p>
                      <p className="num text-sm font-bold">{pct(val as number)}</p>
                      <p className="text-[10px] text-muted-foreground">{h}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {rows.length === 0 && <Empty />}
      </div>

      {/* Tablet & desktop: table */}
      <Card className="hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 [&>th]:h-11 [&>th]:text-xs [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-wider">
              <TableHead className="w-12 pl-5">#</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="hidden lg:table-cell">Category</TableHead>
              <TableHead className="text-right">Jobs</TableHead>
              <TableHead className="text-right">OTIF</TableHead>
              <TableHead className="text-right">Safety</TableHead>
              <TableHead className="text-right">HSE</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="pr-5">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ v, s, prev }, i) => (
              <TableRow
                key={v.id}
                className={cn("num [&>td]:py-3.5", s.tier === "at-risk" && "bg-destructive/[0.03]")}
              >
                <TableCell className="pl-5 text-muted-foreground">{i + 1}</TableCell>
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
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {catName(v.categoryId)}
                </TableCell>
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
                  <span className="font-display text-base font-bold">
                    {s.jobs ? s.overall : "—"}
                  </span>
                  {prev && prev.jobs > 0 && s.jobs > 0 && (
                    <div className="mt-0.5">
                      <Delta value={s.overall - prev.overall} />
                    </div>
                  )}
                </TableCell>
                <TableCell className="pr-5">
                  <TierBadge tier={s.tier} />
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Empty />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </AppShell>
  );
}

function Empty() {
  const { vendors } = useData();
  const [busy, setBusy] = useState(false);
  if (!vendors.length)
    return (
      <div className="rounded-2xl border border-dashed px-6 py-14 text-center">
        <p className="font-semibold">No vendors yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Add your first vendor and log their jobs, or explore with 10 demo vendors.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/vendors">Add a vendor</Link>
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await loadDemoData();
              setBusy(false);
            }}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Load demo data
          </Button>
        </div>
      </div>
    );
  return (
    <div className="py-12 text-center text-sm text-muted-foreground">
      No vendors match these filters.
    </div>
  );
}
