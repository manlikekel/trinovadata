import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Mail,
  Pencil,
  Plus,
  Star,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { AppShell, TierBadge, pct } from "@/components/AppShell";
import { FormSheet } from "@/components/app/Sheet";
import { ScoreRing } from "@/components/app/ScoreRing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { update, uid, useData } from "@/lib/store";
import { comparePeriods, isOtif, scoreJobs, SHARP_DROP, tierAction, type Job } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { VendorForm } from "./vendors.index";

export const Route = createFileRoute("/vendors/$id")({
  head: () => ({
    meta: [
      { title: "Vendor profile — Trinova Vendor Scorecard" },
      { name: "description", content: "Vendor score breakdown, trend and job history." },
      { property: "og:title", content: "Vendor profile — Trinova Vendor Scorecard" },
      { property: "og:description", content: "Vendor score breakdown, trend and job history." },
    ],
  }),
  component: VendorPage,
});

const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
  danger,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-3.5 transition",
        checked && danger && "border-destructive/40 bg-destructive/5",
      )}
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function JobForm({
  vendorId,
  initial,
  onDone,
}: {
  vendorId: string;
  initial?: Job;
  onDone: () => void;
}) {
  const [j, setJ] = useState<Job>(
    initial ?? {
      id: "",
      vendorId,
      dueDate: today(),
      deliveredDate: today(),
      qtyOrdered: 1,
      qtyDelivered: 1,
      incident: false,
      hseCompliant: true,
      hseNotes: "",
      quality: 5,
      notes: "",
    },
  );
  const set = (k: keyof Job, v: unknown) => setJ({ ...j, [k]: v });
  const preview = j.dueDate && j.deliveredDate ? isOtif(j) : null;
  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!j.dueDate || !j.deliveredDate) {
          toast.error("Enter both the due date and the delivered date");
          return;
        }
        if (j.qtyOrdered < 1 || j.qtyDelivered < 0) {
          toast.error("Quantity ordered must be at least 1");
          return;
        }
        const job = { ...j, quality: Math.min(5, Math.max(1, Math.round(j.quality || 1))) };
        update((d) => ({
          ...d,
          jobs: initial
            ? d.jobs.map((x) => (x.id === job.id ? job : x))
            : [...d.jobs, { ...job, id: uid() }],
        }));
        toast.success(initial ? "Job updated" : "Job logged");
        onDone();
      }}
    >
      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Delivery
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Due date</Label>
            <Input type="date" value={j.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Delivered</Label>
            <Input
              type="date"
              value={j.deliveredDate}
              onChange={(e) => set("deliveredDate", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Qty ordered</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={j.qtyOrdered}
              onChange={(e) => set("qtyOrdered", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Qty delivered</Label>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={j.qtyDelivered}
              onChange={(e) => set("qtyDelivered", Number(e.target.value))}
            />
          </div>
        </div>
        {preview !== null && (
          <p
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-medium",
              preview ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {preview ? "Passes on-time-in-full" : "Fails on-time-in-full (late or short)"}
          </p>
        )}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Safety & HSE
        </legend>
        <ToggleRow
          label="Damage or safety incident"
          hint="Counts against the safety score (30%)"
          checked={j.incident}
          onChange={(v) => set("incident", v)}
          danger
        />
        <ToggleRow
          label="Fully HSE compliant"
          hint="PPE worn, procedures and permits followed (20%)"
          checked={j.hseCompliant}
          onChange={(v) => set("hseCompliant", v)}
        />
        <Input
          value={j.hseNotes ?? ""}
          onChange={(e) => set("hseNotes", e.target.value)}
          placeholder={
            j.hseCompliant ? "HSE notes (optional)" : "What was missed? e.g. no PPE, no permit"
          }
        />
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Quality
        </legend>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => set("quality", n)}
              aria-label={`${n} of 5`}
              className="grid h-11 flex-1 place-items-center rounded-xl border transition hover:bg-muted"
            >
              <Star
                className={cn(
                  "h-5 w-5",
                  n <= j.quality ? "fill-warning text-warning" : "text-muted-foreground/40",
                )}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label>Other notes</Label>
        <Input
          value={j.notes ?? ""}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Optional"
        />
      </div>
      <Button type="submit" size="lg" className="w-full">
        {initial ? "Save changes" : "Save job"}
      </Button>
    </form>
  );
}

function VendorPage() {
  const { id } = Route.useParams();
  const data = useData();
  const [jobOpen, setJobOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const v = data.vendors.find((x) => x.id === id);
  if (!v)
    return (
      <AppShell title="Vendor not found">
        <Link to="/vendors" className="text-accent underline">
          Back to vendors
        </Link>
      </AppShell>
    );

  const jobs = data.jobs
    .filter((j) => j.vendorId === id)
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const s = scoreJobs(jobs);
  const months = new Map<string, Job[]>();
  [...jobs].reverse().forEach((j) => {
    const m = j.dueDate.slice(0, 7);
    months.set(m, [...(months.get(m) ?? []), j]);
  });
  const trend = [...months].map(([m, js]) => ({
    month: new Date(m + "-01T00:00:00").toLocaleDateString(undefined, { month: "short" }),
    score: scoreJobs(js).overall,
  }));
  const { current, previous } = comparePeriods(jobs, 60);
  const change = current.jobs && previous.jobs ? current.overall - previous.overall : null;
  const sharp = change !== null && change <= -SHARP_DROP;
  const category = data.categories.find((c) => c.id === v.categoryId)?.name;
  const toggleArchive = () => {
    update((d) => ({
      ...d,
      vendors: d.vendors.map((x) => (x.id === id ? { ...x, archived: !x.archived } : x)),
    }));
    toast.success(v.archived ? "Vendor restored" : "Vendor archived");
  };
  const deleteJob = (j: Job) => {
    if (!confirm("Delete this job?")) return;
    update((d) => ({ ...d, jobs: d.jobs.filter((x) => x.id !== j.id) }));
    toast.success("Job deleted");
  };

  return (
    <AppShell
      title={v.name}
      subtitle={
        <Link
          to="/vendors"
          className="inline-flex items-center gap-1 font-medium hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All vendors
        </Link>
      }
      actions={
        <>
          <Button variant="outline" className="bg-card" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" className="bg-card" onClick={toggleArchive}>
            {v.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            {v.archived ? "Restore" : "Archive"}
          </Button>
          <Button onClick={() => setJobOpen(true)}>
            <Plus className="h-4 w-4" /> Log job
          </Button>
        </>
      }
    >
      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-10">
          <div className="flex items-center gap-5">
            <ScoreRing score={s.jobs ? s.overall : null} tier={s.tier} size={120} stroke={11} />
            <div className="min-w-0">
              <TierBadge tier={s.tier} />
              <h2 className="mt-2 text-xl font-bold leading-tight md:hidden">{v.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {v.code} · {category}
              </p>
              {v.contact && (
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {v.contact}
                </p>
              )}
              {v.contractValue > 0 && (
                <p className="num mt-0.5 text-sm text-muted-foreground">
                  Contract ₦{v.contractValue.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              ["OTIF", "50%", s.otif, `${s.late} late of ${s.jobs}`],
              ["Safety", "30%", s.safety, `${s.incidents} incidents`],
              ["HSE", "20%", s.hse, `quality ${s.jobs ? s.quality.toFixed(1) : "—"}/5`],
            ].map(([l, w, val, h]) => (
              <div key={l as string} className="rounded-xl bg-muted/50 p-3 sm:p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {l} <span className="font-normal normal-case tracking-normal">· {w}</span>
                </p>
                <p className="num mt-1 font-display text-lg font-bold sm:text-2xl">
                  {pct(val as number)}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${val}%` }} />
                </div>
                <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{h}</p>
              </div>
            ))}
          </div>
        </div>
        <div
          className={cn(
            "flex gap-3 border-t px-5 py-4 sm:px-6",
            s.tier === "elite"
              ? "bg-success/[0.06]"
              : s.tier === "at-risk"
                ? "bg-destructive/[0.06]"
                : "bg-muted/40",
          )}
        >
          {(s.tier === "at-risk" || sharp) && (
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          )}
          <div className="text-sm">
            <p className="font-semibold">Automatic action</p>
            <p className="text-muted-foreground">{tierAction[s.tier]}</p>
            {change !== null && (
              <p
                className={cn(
                  "num mt-1",
                  sharp ? "font-semibold text-destructive" : "text-muted-foreground",
                )}
              >
                Last 60 days: {current.overall} ({change >= 0 ? "+" : ""}
                {change.toFixed(1)} vs the 60 days before)
                {sharp && " — sharp fall, review this vendor."}
              </p>
            )}
          </div>
        </div>
      </Card>

      {trend.length > 1 && (
        <Card className="mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly score trend</CardTitle>
          </CardHeader>
          <CardContent className="h-56 px-2 sm:h-64 sm:px-6">
            <ResponsiveContainer>
              <AreaChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="trend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} />
                <ReferenceLine
                  y={85}
                  stroke="var(--destructive)"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    fontSize: 13,
                  }}
                />
                <Area
                  dataKey="score"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  fill="url(#trend)"
                  dot={{ r: 3, fill: "var(--accent)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Job history</h2>
        <span className="num text-sm text-muted-foreground">{jobs.length} jobs</span>
      </div>

      {/* Phone: cards */}
      <div className="space-y-2.5 md:hidden">
        {jobs.map((j) => {
          const ok = isOtif(j);
          return (
            <Card key={j.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{fmtDate(j.dueDate)}</p>
                    <p className="text-xs text-muted-foreground">
                      Delivered {fmtDate(j.deliveredDate)} · {j.qtyDelivered}/{j.qtyOrdered}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      ok ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive",
                    )}
                  >
                    OTIF {ok ? "pass" : "fail"}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  <Chip bad={j.incident}>{j.incident ? "Incident" : "No incident"}</Chip>
                  <Chip bad={!j.hseCompliant}>{j.hseCompliant ? "HSE ok" : "HSE breach"}</Chip>
                  <Chip>
                    {"★".repeat(j.quality)}
                    <span className="opacity-30">{"★".repeat(5 - j.quality)}</span>
                  </Chip>
                </div>
                {(j.hseNotes || j.notes) && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {[j.hseNotes, j.notes].filter(Boolean).join(" · ")}
                  </p>
                )}
                <div className="mt-3 flex gap-2 border-t pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => setEditJob(j)}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => deleteJob(j)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {jobs.length === 0 && <EmptyJobs onAdd={() => setJobOpen(true)} />}
      </div>

      {/* Tablet & desktop: table */}
      <Card className="hidden overflow-hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 [&>th]:h-11 [&>th]:text-xs [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-wider">
              <TableHead className="pl-5">Due</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>OTIF</TableHead>
              <TableHead>Incident</TableHead>
              <TableHead>HSE</TableHead>
              <TableHead>Quality</TableHead>
              <TableHead className="hidden lg:table-cell">Notes</TableHead>
              <TableHead className="pr-5" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((j) => (
              <TableRow key={j.id} className="num">
                <TableCell className="whitespace-nowrap pl-5">{fmtDate(j.dueDate)}</TableCell>
                <TableCell className="whitespace-nowrap">{fmtDate(j.deliveredDate)}</TableCell>
                <TableCell>
                  {j.qtyDelivered}/{j.qtyOrdered}
                </TableCell>
                <TableCell>{isOtif(j) ? <Chip>Pass</Chip> : <Chip bad>Fail</Chip>}</TableCell>
                <TableCell>
                  {j.incident ? (
                    <Chip bad>Yes</Chip>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </TableCell>
                <TableCell>
                  {j.hseCompliant ? (
                    <span className="text-muted-foreground">Yes</span>
                  ) : (
                    <Chip bad>No</Chip>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-warning">
                  {"★".repeat(j.quality)}
                  <span className="text-muted-foreground/30">{"★".repeat(5 - j.quality)}</span>
                </TableCell>
                <TableCell className="hidden max-w-56 truncate text-xs text-muted-foreground lg:table-cell">
                  {[j.hseNotes, j.notes].filter(Boolean).join(" · ")}
                </TableCell>
                <TableCell className="whitespace-nowrap pr-5 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit job"
                    onClick={() => setEditJob(j)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete job"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteJob(j)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {jobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <EmptyJobs onAdd={() => setJobOpen(true)} />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <FormSheet
        open={jobOpen}
        onOpenChange={setJobOpen}
        title="Log a job"
        description={`Record a delivery or service by ${v.name}.`}
      >
        <JobForm vendorId={id} onDone={() => setJobOpen(false)} />
      </FormSheet>
      <FormSheet open={editOpen} onOpenChange={setEditOpen} title="Edit vendor">
        <VendorForm initial={v} onDone={() => setEditOpen(false)} />
      </FormSheet>
      <FormSheet open={!!editJob} onOpenChange={(o) => !o && setEditJob(null)} title="Edit job">
        {editJob && (
          <JobForm
            key={editJob.id}
            vendorId={id}
            initial={editJob}
            onDone={() => setEditJob(null)}
          />
        )}
      </FormSheet>
    </AppShell>
  );
}

function Chip({ bad, children }: { bad?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        bad ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground/80",
      )}
    >
      {children}
    </span>
  );
}

function EmptyJobs({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed py-12 text-center">
      <p className="font-medium">No jobs logged yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Log the first delivery to start scoring this vendor.
      </p>
      <Button className="mt-4" onClick={onAdd}>
        <Plus className="h-4 w-4" /> Log job
      </Button>
    </div>
  );
}
