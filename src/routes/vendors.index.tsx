import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { AppShell, TierBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { update, uid, useData, type Vendor } from "@/lib/store";
import { scoreJobs } from "@/lib/scoring";

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
        <Label>Name</Label>
        <Input value={f.name} onChange={(e) => set("name", e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Vendor ID</Label>
          <Input
            value={f.code}
            onChange={(e) => set("code", e.target.value)}
            placeholder="VN-001"
          />
        </div>
        <div>
          <Label>Category</Label>
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
        <Label>Contact</Label>
        <Input value={f.contact} onChange={(e) => set("contact", e.target.value)} />
      </div>
      <div>
        <Label>Contract value (₦)</Label>
        <Input
          type="number"
          min={0}
          value={f.contractValue}
          onChange={(e) => set("contractValue", Number(e.target.value))}
        />
      </div>
      <Button type="submit" className="w-full">
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
  const list = data.vendors.filter(
    (v) =>
      v.archived === showArchived &&
      (!needle || v.name.toLowerCase().includes(needle) || v.code.toLowerCase().includes(needle)),
  );
  return (
    <AppShell
      title="Vendors"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Add vendor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New vendor</DialogTitle>
            </DialogHeader>
            <VendorForm onDone={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vendor name or ID"
            className="pl-9 bg-card"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowArchived(!showArchived)}>
          {showArchived ? "Show active vendors" : "Show archived vendors"}
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v) => {
          const s = scoreJobs(data.jobs.filter((j) => j.vendorId === v.id));
          return (
            <Link key={v.id} to="/vendors/$id" params={{ id: v.id }}>
              <Card className="h-full transition hover:border-accent">
                <CardContent className="p-5">
                  <div className="flex justify-between gap-2">
                    <p className="font-semibold">{v.name}</p>
                    <TierBadge tier={s.tier} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {v.code} · {data.categories.find((c) => c.id === v.categoryId)?.name}
                  </p>
                  <p className="mt-4 font-display text-2xl font-bold">{s.jobs ? s.overall : "—"}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.jobs} jobs logged
                    {v.contractValue ? ` · ₦${v.contractValue.toLocaleString()}` : ""}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {list.length === 0 && <p className="text-muted-foreground">No vendors here yet.</p>}
      </div>
    </AppShell>
  );
}
