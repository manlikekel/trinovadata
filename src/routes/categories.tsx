import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { clearAll, resetToSample, update, uid, useData } from "@/lib/store";

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
    <AppShell
      title="Categories"
      subtitle="Group vendors so you can compare like with like on the scoreboard."
    >
      <form
        className="mb-6 flex max-w-xl gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          if (data.categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
            toast.error("That category already exists");
            return;
          }
          update((d) => ({
            ...d,
            categories: [...d.categories, { id: uid(), name: name.trim() }],
          }));
          setName("");
          toast.success("Category added");
        }}
      >
        <Input
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 rounded-xl bg-card md:h-10"
        />
        <Button type="submit" className="h-11 md:h-10">
          Add
        </Button>
      </form>
      <Card className="max-w-xl divide-y overflow-hidden">
        {data.categories.map((c) => {
          const count = data.vendors.filter((v) => v.categoryId === c.id).length;
          return (
            <div key={c.id} className="flex items-center gap-2 px-3 py-2">
              <Input
                defaultValue={c.name}
                className="border-transparent bg-transparent font-medium shadow-none focus-visible:bg-muted/40"
                onBlur={(e) => {
                  const n = e.target.value.trim();
                  if (n && n !== c.name) {
                    update((d) => ({
                      ...d,
                      categories: d.categories.map((x) => (x.id === c.id ? { ...x, name: n } : x)),
                    }));
                    toast.success("Renamed");
                  }
                }}
              />
              <span className="num whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {count}
              </span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${c.name}`}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (count) {
                    toast.error("Move its vendors to another category first");
                    return;
                  }
                  update((d) => ({
                    ...d,
                    categories: d.categories.filter((x) => x.id !== c.id),
                  }));
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
      </Card>
      <p className="mt-2 max-w-xl text-xs text-muted-foreground">
        Tap a name to rename it. The number shows how many vendors use it.
      </p>
      <h2 className="mt-12 text-lg font-semibold">Data</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Data is stored on this device until sign-in is added.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            if (confirm("Replace all data with the sample data?")) resetToSample();
          }}
        >
          Reset to sample data
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            if (confirm("Delete all vendors and jobs and start fresh?")) {
              clearAll();
              toast.success("All data cleared");
            }
          }}
        >
          Start with empty data
        </Button>
      </div>
    </AppShell>
  );
}
