import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resetToSample, update, uid, useData } from "@/lib/store";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Trinova Vendor Scorecard" },
      { name: "description", content: "Organise vendors into categories." },
      { property: "og:title", content: "Categories — Trinova Vendor Scorecard" },
      { property: "og:description", content: "Organise vendors into categories." },
    ],
  }),
  component: Categories,
});

function Categories() {
  const data = useData();
  const [name, setName] = useState("");
  return (
    <AppShell title="Vendor categories">
      <form className="mb-6 flex gap-2 max-w-md" onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        update((d) => ({ ...d, categories: [...d.categories, { id: uid(), name: name.trim() }] }));
        setName(""); toast.success("Category added");
      }}>
        <Input placeholder="New category name" value={name} onChange={(e) => setName(e.target.value)} className="bg-card" />
        <Button type="submit">Add</Button>
      </form>
      <div className="space-y-2 max-w-xl">
        {data.categories.map((c) => {
          const count = data.vendors.filter((v) => v.categoryId === c.id).length;
          return (
            <Card key={c.id}><CardContent className="p-3 flex items-center gap-3">
              <Input defaultValue={c.name} className="border-transparent shadow-none" onBlur={(e) => {
                const n = e.target.value.trim();
                if (n && n !== c.name) { update((d) => ({ ...d, categories: d.categories.map((x) => (x.id === c.id ? { ...x, name: n } : x)) })); toast.success("Renamed"); }
              }} />
              <span className="text-xs text-muted-foreground whitespace-nowrap">{count} vendors</span>
              <Button variant="ghost" size="sm" onClick={() => {
                if (count) { toast.error("Move its vendors to another category first"); return; }
                update((d) => ({ ...d, categories: d.categories.filter((x) => x.id !== c.id) }));
              }}>Delete</Button>
            </CardContent></Card>
          );
        })}
      </div>
      <Button variant="outline" className="mt-10" onClick={() => { if (confirm("Replace all data with the sample data?")) resetToSample(); }}>
        Reset to sample data
      </Button>
    </AppShell>
  );
}
