import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, Users, Tags, BellRing } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Tier } from "@/lib/scoring";
import { tierLabel } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Scoreboard", icon: LayoutDashboard },
  { to: "/vendors", label: "Vendors", icon: Users },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/alerts", label: "Early warnings", icon: BellRing },
] as const;

export function AppShell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="bg-sidebar text-sidebar-foreground md:w-60 md:min-h-screen shrink-0">
        <div className="px-5 py-5">
          <Link to="/" className="font-display text-lg font-bold text-sidebar-primary-foreground">
            Trinova<span className="text-sidebar-primary">.</span>
          </Link>
          <p className="text-xs opacity-70">Vendor Scorecard</p>
        </div>
        <nav className="flex md:flex-col gap-1 px-3 pb-3 overflow-x-auto">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground font-semibold" }}
            >
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}

export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <Badge
      className={cn(
        "border-transparent",
        tier === "elite" && "bg-success text-success-foreground",
        tier === "standard" && "bg-warning text-warning-foreground",
        tier === "at-risk" && "bg-destructive text-destructive-foreground",
        tier === "none" && "bg-muted text-muted-foreground",
      )}
    >
      {tierLabel[tier]}
    </Badge>
  );
}

export const pct = (n: number) => `${n.toFixed(1)}%`;
