import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AppShell, TierBadge } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const { categories } = useData();
  const [f, setF] = useState<Vendor>(
    initial ?? { id: "", name: "", code: "", categoryId: categories[0]?.id ?? "", contact: "", contractValue: 0, archived: false },
  );
  const set = (k: keyof Vendor, v: string | number) => setF({ ...f, [k]: v });
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!f.name.trim()) return toast.error("Vendor name is required");
        update((d) => ({
          ...d,
          vendors: initial ? d.vendors.map((v) => (v.id === f.id ? f : v)) : [...d.vendors, { ...f, id: uid() }],
        }));
        toast.success(initial ? "Vendor updated" : "Vendor added");
        onDone();
      }}
    >
      <div><Label>Name</Label><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Vendor ID</Label><Input value={f.code} onChange={(e) => set("code", e.target.value)} placeholder="VN-001" /></div>
        <div><Label>Category</Label>
          <Select value={f.categoryId} onValueChange={(v) => set("categoryId", v)}>
            <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Contact</Label><Input value={f.contact} onChange={(e) => set("contact", e.target.value)} /></div>
      <div><Label>Contract value (₦)</Label><Input type="number" value={f.contractValue} onChange={(e) => set("contractValue", Number(e.target.value))} /></div>
      <Button type="submit" className="w-full">Save vendor</Button>
    </form>
  );
}

function Vendors() {
  const data = useData();
  const [open, setOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const list = data.vendors.filter((v) => v.archived === showArchived);
  return (
    <AppShell
      title="Vendors"
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Add vendor</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>New vendor</DialogTitle></DialogHeader><VendorForm onDone={() => setOpen(false)} /></DialogContent>
        </Dialog>
      }
    >
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => setShowArchived(!showArchived)}>
        {showArchived ? "Show active vendors" : "Show archived vendors"}
      </Button>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v) => {
          const s = scoreJobs(data.jobs.filter((j) => j.vendorId === v.id));
          return (
            <Link key={v.id} to="/vendors/$id" params={{ id: v.id }}>
              <Card className="h-full transition hover:border-accent"><CardContent className="p-5">
                <div className="flex justify-between gap-2"><p className="font-semibold">{v.name}</p><TierBadge tier={s.tier} /></div>
                <p className="text-xs text-muted-foreground">{v.code} · {data.categories.find((c) => c.id === v.categoryId)?.name}</p>
                <p className="mt-4 font-display text-2xl font-bold">{s.jobs ? s.overall : "—"}</p>
                <p className="text-xs text-muted-foreground">{s.jobs} jobs logged</p>
              </CardContent></Card>
            </Link>
          );
        })}
        {list.length === 0 && <p className="text-muted-foreground">No vendors here yet.</p>}
      </div>
    </AppShell>
  );
}
