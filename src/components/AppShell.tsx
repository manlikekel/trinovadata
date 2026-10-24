import { Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { BellRing, CircleHelp, Download, LayoutDashboard, Tags, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BrandMark, BrandName } from "@/components/app/Brand";
import { InstallPrompt, useInstallAction } from "@/components/app/InstallPrompt";
import { Onboarding } from "@/components/app/Onboarding";
import { maybeStartGuide, openGuide } from "@/lib/onboarding";
import { initPwa } from "@/lib/pwa";
import type { Tier } from "@/lib/scoring";
import { tierLabel } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Scoreboard", short: "Scores", icon: LayoutDashboard },
  { to: "/vendors", label: "Vendors", short: "Vendors", icon: Users },
  { to: "/alerts", label: "Early warnings", short: "Alerts", icon: BellRing },
  { to: "/categories", label: "Categories", short: "Categories", icon: Tags },
] as const;

/**
 * App frame for every signed-in page.
 * - Phone (< 768px): sticky top bar + bottom tab bar, safe-area aware for iPhone notch / home bar.
 * - Tablet (768–1279px): slim icon rail.
 * - Desktop (≥ 1280px): full sidebar.
 */
export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const install = useInstallAction();
  useEffect(() => {
    initPwa();
    maybeStartGuide();
  }, []);

  return (
    <div className="min-h-dvh bg-background">
      {/* Sidebar: rail on tablet, full on desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col bg-sidebar text-sidebar-foreground md:flex xl:w-64">
        <Link to="/" className="flex items-center gap-3 px-5 pb-6 pt-6 xl:px-6">
          <BrandMark className="h-10 w-10 ring-1 ring-white/10 rounded-[11px]" />
          <BrandName className="hidden text-sidebar-primary-foreground xl:block" subtle />
        </Link>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              title={n.label}
              className="group flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground xl:flex-row xl:gap-3 xl:px-3 xl:text-sm"
              activeProps={{
                className:
                  "!bg-sidebar-accent !text-white shadow-[inset_3px_0_0_var(--sidebar-primary)]",
              }}
            >
              <n.icon className="h-5 w-5 xl:h-[18px] xl:w-[18px]" />
              <span className="xl:hidden">{n.short}</span>
              <span className="hidden xl:inline">{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="space-y-1 border-t border-sidebar-border px-3 py-4">
          {install.available && (
            <SideButton icon={Download} label="Install app" onClick={install.run} />
          )}
          <SideButton icon={CircleHelp} label="App guide" onClick={openGuide} />
        </div>
      </aside>

      {/* Phone top bar */}
      <header className="pt-safe sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl md:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link to="/" aria-label="Home">
            <BrandMark className="h-8 w-8 rounded-[9px]" />
          </Link>
          <p className="font-display flex-1 truncate text-base font-semibold">{title}</p>
          {install.available && (
            <button
              onClick={install.run}
              aria-label="Install app"
              className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <Download className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={openGuide}
            aria-label="App guide"
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <CircleHelp className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="md:pl-20 xl:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 pb-[calc(env(safe-area-inset-bottom)+96px)] pt-5 sm:px-6 md:pb-12 md:pt-8 lg:px-10">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between md:mb-8">
            <div className="min-w-0">
              <h1 className="hidden text-[28px] font-bold leading-tight md:block lg:text-[32px]">
                {title}
              </h1>
              {subtitle && (
                <div className="text-sm text-muted-foreground md:mt-1.5">{subtitle}</div>
              )}
            </div>
            {actions && (
              <div className="flex flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>
            )}
          </div>
          {children}
        </div>
      </main>

      {/* Phone bottom tabs */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-4">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] font-medium text-muted-foreground"
              activeProps={{
                className: "!text-primary [&_svg]:fill-accent/15 [&_svg]:text-accent",
              }}
            >
              <n.icon className="h-[22px] w-[22px]" />
              {n.short}
            </Link>
          ))}
        </div>
      </nav>

      <Onboarding />
      <InstallPrompt />
      {install.dialog}
    </div>
  );
}

function SideButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Download;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex w-full flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-foreground xl:flex-row xl:gap-3 xl:px-3 xl:text-sm"
    >
      <Icon className="h-5 w-5 xl:h-[18px] xl:w-[18px]" />
      <span className="xl:hidden">{label.split(" ")[1] === "guide" ? "Guide" : "Install"}</span>
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}

const tierStyle: Record<Tier, string> = {
  elite: "bg-success/12 text-success ring-success/25",
  standard: "bg-warning/18 text-warning-foreground ring-warning/40",
  "at-risk": "bg-destructive/10 text-destructive ring-destructive/25",
  none: "bg-muted text-muted-foreground ring-border",
};

export function TierBadge({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <Badge
      className={cn(
        "gap-1.5 rounded-full border-transparent px-2.5 py-0.5 font-semibold ring-1 ring-inset shadow-none hover:bg-inherit",
        tierStyle[tier],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {tierLabel[tier]}
    </Badge>
  );
}

export const pct = (n: number) => `${n.toFixed(1)}%`;
