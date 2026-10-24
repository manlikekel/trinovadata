import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ChevronRight, Plus, Search } from "lucide-react";
import { AppShell, TierBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormSheet } from "@/components/app/Sheet";
import { ScoreRing } from "@/components/app/ScoreRing";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { update, uid, useData, type Vendor } from "@/lib/store";
import { scoreJobs } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vendors/")({
  head: () => ({
    meta: [
      { title: "Vendors — Trinova Vendor Scorecard" },
      { name: "description", content: "Manage your vendor list and categories." },
      { property: "og:title", content: "Vendors — Trinova Vendor Scorecard" },
      { property: "og:description", content: "Manage your vendor list and categories." },
    ],
  }),
  component: Vendors,
});

export function VendorForm({ initial, onDone }: { initial?: Vendor; onDone: () => void }) {
  const { categories, vendors } = useData();
  const [f, setF] = useState<Vendor>(
    initial ?? {
      id: "",
      name: "",
      code: "",
      categoryId: categories[0]?.id ?? "",
      contact: "",
      contractValue: 0,
      archived: false,
    },
  );
  const set = (k: keyof Vendor, v: string | number) => setF({ ...f, [k]: v });
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.name.trim()) {
          toast.error("Vendor name is required");
          return;
        }
        if (!f.categoryId) {
          toast.error("Choose a category");
          return;
        }
        if (
          f.code.trim() &&
          vendors.some(
            (v) => v.id !== f.id && v.code.trim().toLowerCase() === f.code.trim().toLowerCase(),
          )
        ) {
          toast.error(`Vendor ID ${f.code} is already in use`);
          return;
        }
        update((d) => ({
          ...d,
          vendors: initial
            ? d.vendors.map((v) => (v.id === f.id ? f : v))
            : [...d.vendors, { ...f, id: uid() }],
        }));
        toast.success(initial ? "Vendor updated" : "Vendor added");
        onDone();
      }}
    >
      <div>
        <Label className="mb-1.5 block">Name</Label>
        <Input value={f.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-1.5 block">Vendor ID</Label>
          <Input
            value={f.code}
            onChange={(e) => set("code", e.target.value)}
            placeholder="VN-001"
          />
        </div>
        <div>
          <Label className="mb-1.5 block">Category</Label>
          <Select value={f.categoryId} onValueChange={(v) => set("categoryId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="mb-1.5 block">Contact</Label>
        <Input value={f.contact} onChange={(e) => set("contact", e.target.value)} />
      </div>
      <div>
        <Label className="mb-1.5 block">Contract value (₦)</Label>
        <Input
          type="number"
          min={0}
          value={f.contractValue}
          onChange={(e) => set("contractValue", Number(e.target.value))}
        />
      </div>
      <Button type="submit" size="lg" className="w-full">
        Save vendor
      </Button>
    </form>
  );
}

function Vendors() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const list = data.vendors
    .filter(
      (v) =>
        v.archived === showArchived &&
        (!needle || v.name.toLowerCase().includes(needle) || v.code.toLowerCase().includes(needle)),
    )
    .map((v) => ({ v, s: scoreJobs(data.jobs.filter((j) => j.vendorId === v.id)) }))
    .sort((a, b) => a.v.name.localeCompare(b.v.name));
  const active = data.vendors.filter((v) => !v.archived).length;

  return (
    <AppShell
      title="Vendors"
      subtitle={`${active} active vendor${active === 1 ? "" : "s"} · tap one to log jobs and see its profile`}
      actions={
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Add vendor
        </Button>
      }
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vendor name or ID"
            className="h-11 rounded-xl bg-card pl-10 md:h-10"
          />
        </div>
        <div className="inline-flex self-start rounded-xl bg-muted p-1 text-sm">
          {[false, true].map((a) => (
            <button
              key={String(a)}
              onClick={() => setShowArchived(a)}
              className={cn(
                "rounded-lg px-4 py-1.5 font-medium transition",
                showArchived === a ? "bg-card shadow-card" : "text-muted-foreground",
              )}
            >
              {a ? "Archived" : "Active"}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {list.map(({ v, s }) => (
          <Link key={v.id} to="/vendors/$id" params={{ id: v.id }} className="group">
            <Card className="h-full transition group-hover:-translate-y-0.5 group-hover:border-accent/40 group-hover:shadow-float group-active:scale-[0.99]">
              <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                <ScoreRing score={s.jobs ? s.overall : null} tier={s.tier} size={64} stroke={7} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{v.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {v.code} · {data.categories.find((c) => c.id === v.categoryId)?.name}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <TierBadge tier={s.tier} />
                    <span className="num text-xs text-muted-foreground">
                      {s.jobs} jobs
                      {v.contractValue ? ` · ₦${v.contractValue.toLocaleString()}` : ""}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {list.length === 0 && (
        <div className="rounded-2xl border border-dashed py-14 text-center">
          <p className="font-medium">
            {needle
              ? "No vendors match your search"
              : showArchived
                ? "No archived vendors"
                : "No vendors yet"}
          </p>
          {!showArchived && !needle && (
            <Button className="mt-4" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Add your first vendor
            </Button>
          )}
        </div>
      )}
      <FormSheet
        open={open}
        onOpenChange={setOpen}
        title="New vendor"
        description="Add a vendor, then log their jobs to start scoring."
      >
        <VendorForm onDone={() => setOpen(false)} />
      </FormSheet>
    </AppShell>
  );
}
