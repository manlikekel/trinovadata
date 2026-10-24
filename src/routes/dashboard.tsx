import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, TierBadge, pct } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useData } from "@/lib/store";
import { scoreJobs, type Tier } from "@/lib/scoring";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Scoreboard — Trinova Vendor Scorecard" },
      { name: "description", content: "Ranked vendor performance with OTIF, safety and HSE scores." },
      { property: "og:title", content: "Scoreboard — Trinova Vendor Scorecard" },
      { property: "og:description", content: "Ranked vendor performance with OTIF, safety and HSE scores." },
    ],
  }),
  component: Dashboard,
});

const ranges = { "30": "Last 30 days", "90": "Last 90 days", "365": "Last 12 months", all: "All time" };

function Dashboard() {
  const data = useData();
  const [range, setRange] = useState("90");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    const cutoff = range === "all" ? "" : new Date(Date.now() - Number(range) * 864e5).toISOString().slice(0, 10);
    return data.vendors
      .filter((v) => !v.archived && (cat === "all" || v.categoryId === cat))
      .map((v) => ({ v, s: scoreJobs(data.jobs.filter((j) => j.vendorId === v.id && j.dueDate >= cutoff)) }))
      .filter((r) => status === "all" || r.s.tier === (status as Tier))
      .sort((a, b) => b.s.overall - a.s.overall);
  }, [data, range, cat, status]);

  const scored = rows.filter((r) => r.s.jobs > 0);
  const avg = (k: "otif" | "safety") => (scored.length ? scored.reduce((a, r) => a + r.s[k], 0) / scored.length : 0);
  const catName = (id: string) => data.categories.find((c) => c.id === id)?.name ?? "—";

  const cards = [
    { label: "Average OTIF", value: pct(avg("otif")), hint: "Target ≥ 95%" },
    { label: "Incident rate", value: pct(100 - avg("safety")), hint: "Damage / loss" },
    { label: "Top performers", value: scored.filter((r) => r.s.tier === "elite").length, hint: "Score ≥ 95" },
    { label: "At-risk vendors", value: scored.filter((r) => r.s.tier === "at-risk").length, hint: "Score < 85" },
  ];

  return (
    <AppShell title="Vendor scoreboard">
      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-44 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(ranges).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={cat} onValueChange={setCat}>
          <SelectTrigger className="w-52 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {data.categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="elite">Elite</SelectItem>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="at-risk">At-Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        {cards.map((c) => (
          <Card key={c.label}><CardContent className="p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className="mt-1 font-display text-3xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.hint}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="p-0 overflow-x-auto">
        <Table>
          <TableHeader><TableRow>
            <TableHead>#</TableHead><TableHead>Vendor</TableHead><TableHead>Category</TableHead>
            <TableHead className="text-right">Jobs</TableHead><TableHead className="text-right">OTIF</TableHead>
            <TableHead className="text-right">Safety</TableHead><TableHead className="text-right">HSE</TableHead>
            <TableHead className="text-right">Score</TableHead><TableHead>Status</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map(({ v, s }, i) => (
              <TableRow key={v.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell>
                  <Link to="/vendors/$id" params={{ id: v.id }} className="font-semibold hover:text-accent">{v.name}</Link>
                  <p className="text-xs text-muted-foreground">{v.code} · {s.late} late</p>
                </TableCell>
                <TableCell className="text-sm">{catName(v.categoryId)}</TableCell>
                <TableCell className="text-right">{s.jobs}</TableCell>
                <TableCell className="text-right">{pct(s.otif)}</TableCell>
                <TableCell className="text-right">{pct(s.safety)}</TableCell>
                <TableCell className="text-right">{pct(s.hse)}</TableCell>
                <TableCell className="text-right font-display font-bold">{s.overall}</TableCell>
                <TableCell><TierBadge tier={s.tier} /></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                No vendors match. <Link to="/vendors" className="text-accent underline">Add a vendor</Link>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent></Card>
    </AppShell>
  );
}
