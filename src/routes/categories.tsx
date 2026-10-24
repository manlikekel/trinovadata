import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import {
  addCategory,
  clearAll,
  deleteCategory,
  forgetLocalData,
  importData,
  loadDemoData,
  localData,
  renameCategory,
  useData,
  type Data,
} from "@/lib/store";

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
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          if (data.categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
            toast.error("That category already exists");
            return;
          }
          const added = name.trim();
          setName("");
          if (await addCategory(added)) toast.success("Category added");
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
                onBlur={async (e) => {
                  const input = e.currentTarget;
                  const n = input.value.trim();
                  if (!n) input.value = c.name;
                  else if (n !== c.name) {
                    if (await renameCategory(c.id, n)) toast.success("Renamed");
                    else input.value = c.name;
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
                  void deleteCategory(c.id);
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
      <DataTools />
    </AppShell>
  );
}

function DataTools() {
  const { vendors } = useData();
  const auth = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [local, setLocal] = useState<Data | null>(null);
  useEffect(() => setLocal(localData()), []);
  const run = async (key: string, fn: () => Promise<boolean>, done: string) => {
    setBusy(key);
    const ok = await fn();
    setBusy(null);
    if (ok) toast.success(done);
  };
  return (
    <section className="mt-12 max-w-xl">
      <h2 className="text-lg font-semibold">Company data</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Saved securely in your {auth.orgName ? `“${auth.orgName}”` : "company"} account and shared
        with your team.
      </p>
      {local && (
        <Card className="mb-4 border-accent/40 bg-accent/[0.05] p-4">
          <p className="font-medium">Data found on this device</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {local.vendors.length} vendors and {local.jobs.length} jobs were saved in this browser
            before accounts existed.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              disabled={!!busy}
              onClick={() =>
                run(
                  "import",
                  async () => {
                    const ok = await importData(local);
                    if (ok) {
                      forgetLocalData();
                      setLocal(null);
                    }
                    return ok;
                  },
                  "Imported into your account",
                )
              }
            >
              {busy === "import" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import into my account
            </Button>
            <Button
              variant="ghost"
              disabled={!!busy}
              onClick={() => {
                forgetLocalData();
                setLocal(null);
              }}
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={!!busy}
          onClick={() => {
            const msg = vendors.length
              ? "Replace ALL your vendors and jobs with the 10-vendor demo data? This can't be undone."
              : "Load the 10-vendor demo data?";
            if (confirm(msg)) void run("demo", loadDemoData, "Demo data loaded");
          }}
        >
          {busy === "demo" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Load demo data
        </Button>
        {auth.role === "owner" && (
          <Button
            variant="outline"
            disabled={!!busy || !vendors.length}
            className="text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm("Delete ALL vendors and jobs for your company? This can't be undone."))
                void run("clear", clearAll, "All vendors and jobs deleted");
            }}
          >
            {busy === "clear" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete all data
          </Button>
        )}
      </div>
    </section>
  );
}
