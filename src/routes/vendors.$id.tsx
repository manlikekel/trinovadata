import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AppShell, TierBadge, pct } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  return (
    <form
      className="space-y-4"
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Due date</Label>
          <Input type="date" value={j.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
        </div>
        <div>
          <Label>Delivered date</Label>
          <Input
            type="date"
            value={j.deliveredDate}
            onChange={(e) => set("deliveredDate", e.target.value)}
          />
        </div>
        <div>
          <Label>Qty ordered</Label>
          <Input
            type="number"
            min={0}
            value={j.qtyOrdered}
            onChange={(e) => set("qtyOrdered", Number(e.target.value))}
          />
        </div>
        <div>
          <Label>Qty delivered</Label>
          <Input
            type="number"
            min={0}
            value={j.qtyDelivered}
            onChange={(e) => set("qtyDelivered", Number(e.target.value))}
          />
        </div>
      </div>
      <div>
        <Label>Quality (1–5)</Label>
        <Input
          type="number"
          min={1}
          max={5}
          value={j.quality}
          onChange={(e) => set("quality", Number(e.target.value))}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={j.incident} onCheckedChange={(v) => set("incident", !!v)} /> Damage or
        safety incident occurred
      </label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={j.hseCompliant} onCheckedChange={(v) => set("hseCompliant", !!v)} />{" "}
        Fully HSE compliant (PPE, procedures)
      </label>
      <div>
        <Label>HSE notes</Label>
        <Input
          value={j.hseNotes ?? ""}
          onChange={(e) => set("hseNotes", e.target.value)}
          placeholder={j.hseCompliant ? "Optional" : "What was missed? e.g. no PPE, no permit"}
        />
      </div>
      <div>
        <Label>Other notes</Label>
        <Input value={j.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
      </div>
      <Button type="submit" className="w-full">
        Save job
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
  const trend = [...months].map(([m, js]) => ({ month: m, score: scoreJobs(js).overall }));
  const { current, previous } = comparePeriods(jobs, 60);
  const change = current.jobs && previous.jobs ? current.overall - previous.overall : null;
  const actionTone =
    s.tier === "elite"
      ? "border-success bg-success/5"
      : s.tier === "at-risk"
        ? "border-destructive bg-destructive/5"
        : "border-accent";

  return (
    <AppShell
      title={v.name}
      actions={
        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit vendor</DialogTitle>
              </DialogHeader>
              <VendorForm initial={v} onDone={() => setEditOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            onClick={() => {
              update((d) => ({
                ...d,
                vendors: d.vendors.map((x) => (x.id === id ? { ...x, archived: !x.archived } : x)),
              }));
              toast.success(v.archived ? "Vendor restored" : "Vendor archived");
            }}
          >
            {v.archived ? "Restore" : "Archive"}
          </Button>
          <Dialog open={jobOpen} onOpenChange={setJobOpen}>
            <DialogTrigger asChild>
              <Button>Log job</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log a job or delivery</DialogTitle>
              </DialogHeader>
              <JobForm vendorId={id} onDone={() => setJobOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <p className="-mt-4 mb-6 text-sm text-muted-foreground">
        {v.code} · {data.categories.find((c) => c.id === v.categoryId)?.name} · {v.contact}
      </p>
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="md:col-span-1">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Overall score</p>
            <p className="font-display text-4xl font-bold">{s.jobs ? s.overall : "—"}</p>
            <div className="mt-2">
              <TierBadge tier={s.tier} />
            </div>
          </CardContent>
        </Card>
        {[
          ["OTIF (50%)", s.otif, `${s.late} late of ${s.jobs} jobs`],
          ["Safety (30%)", s.safety, `${s.incidents} incidents`],
          ["HSE (20%)", s.hse, `avg quality ${s.jobs ? s.quality.toFixed(1) : "—"} / 5`],
        ].map(([l, val, h]) => (
          <Card key={l as string}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{l}</p>
              <p className="font-display text-2xl font-bold">{pct(val as number)}</p>
              <p className="text-xs text-muted-foreground">{h}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className={`mb-6 ${actionTone}`}>
        <CardContent className="p-5">
          <p className="text-sm font-semibold">Automatic action</p>
          <p className="text-sm text-muted-foreground">{tierAction[s.tier]}</p>
          {change !== null && (
            <p
              className={`mt-2 text-sm ${change <= -SHARP_DROP ? "text-destructive font-semibold" : "text-muted-foreground"}`}
            >
              Last 60 days: {current.overall} ({change >= 0 ? "+" : ""}
              {change.toFixed(1)} vs the 60 days before)
              {change <= -SHARP_DROP && " — sharp fall, review this vendor."}
            </p>
          )}
        </CardContent>
      </Card>
      {trend.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Monthly score trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid stroke="var(--border)" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip />
                <Line dataKey="score" stroke="var(--chart-1)" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Job history</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Due</TableHead>
                <TableHead>Delivered</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>OTIF</TableHead>
                <TableHead>Incident</TableHead>
                <TableHead>HSE</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>{j.dueDate}</TableCell>
                  <TableCell>{j.deliveredDate}</TableCell>
                  <TableCell>
                    {j.qtyDelivered}/{j.qtyOrdered}
                  </TableCell>
                  <TableCell>
                    {isOtif(j) ? (
                      "Pass"
                    ) : (
                      <span className="text-destructive font-semibold">Fail</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {j.incident ? <span className="text-destructive">Yes</span> : "No"}
                  </TableCell>
                  <TableCell>
                    {j.hseCompliant ? "Yes" : <span className="text-destructive">No</span>}
                  </TableCell>
                  <TableCell>{j.quality}/5</TableCell>
                  <TableCell className="max-w-56 text-xs text-muted-foreground">
                    {[j.hseNotes, j.notes].filter(Boolean).join(" · ")}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => setEditJob(j)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!confirm("Delete this job?")) return;
                        update((d) => ({ ...d, jobs: d.jobs.filter((x) => x.id !== j.id) }));
                        toast.success("Job deleted");
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {jobs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No jobs logged yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!editJob} onOpenChange={(o) => !o && setEditJob(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit job</DialogTitle>
          </DialogHeader>
          {editJob && (
            <JobForm
              key={editJob.id}
              vendorId={id}
              initial={editJob}
              onDone={() => setEditJob(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
