import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  BellRing,
  Building2,
  CircleHelp,
  Download,
  LayoutDashboard,
  Loader2,
  LogOut,
  RefreshCw,
  Tags,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { BrandMark, BrandName } from "@/components/app/Brand";
import { InstallPrompt, useInstallAction } from "@/components/app/InstallPrompt";
import { Onboarding } from "@/components/app/Onboarding";
import { initAuth, renameCompany, signOut, UNNAMED_COMPANY, useAuth } from "@/lib/auth";
import { openGuide } from "@/lib/onboarding";
import { initPwa } from "@/lib/pwa";
import type { Tier } from "@/lib/scoring";
import { tierLabel } from "@/lib/scoring";
import { loadData, useDataStatus } from "@/lib/store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/dashboard", label: "Scoreboard", short: "Scores", icon: LayoutDashboard },
  { to: "/vendors", label: "Vendors", short: "Vendors", icon: Users },
  { to: "/alerts", label: "Early warnings", short: "Alerts", icon: BellRing },
  { to: "/categories", label: "Categories", short: "Categories", icon: Tags },
] as const;

/**
 * App frame for every signed-in page. Sends signed-out visitors to /auth.
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
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    initPwa();
    initAuth();
  }, []);
  const here = location.pathname;
  useEffect(() => {
    if (auth.status === "signed-out" && here !== "/auth")
      void navigate({ to: "/auth", search: { redirect: here }, replace: true });
    // `here` is read when sign-out is detected; re-running on its change would loop to /auth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.status, navigate]);

  if (auth.status !== "signed-in") return <Gate status={auth.status} />;
  const needsCompanyName = auth.role === "owner" && auth.orgName === UNNAMED_COMPANY;

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
          <AccountMenu side="right">
            <button className="mt-2 flex w-full flex-col items-center gap-1 rounded-xl p-2 text-left transition hover:bg-sidebar-accent xl:flex-row xl:gap-3">
              <Avatar name={auth.fullName || auth.user?.email || "?"} />
              <span className="hidden min-w-0 flex-1 xl:block">
                <span className="block truncate text-sm font-semibold text-white">
                  {auth.fullName || auth.user?.email}
                </span>
                <span className="block truncate text-xs text-sidebar-foreground/60">
                  {auth.orgName}
                </span>
              </span>
            </button>
          </AccountMenu>
        </div>
      </aside>

      {/* Phone top bar */}
      <header className="pt-safe sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl md:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link to="/" aria-label="Home">
            <BrandMark className="h-8 w-8 rounded-[9px]" />
          </Link>
          <p className="font-display flex-1 truncate text-base font-semibold">{title}</p>
          <AccountMenu side="bottom" install={install.available ? install.run : undefined}>
            <button aria-label="Account menu" className="rounded-full">
              <Avatar name={auth.fullName || auth.user?.email || "?"} small />
            </button>
          </AccountMenu>
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
          <DataGate>{children}</DataGate>
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

      {needsCompanyName ? <CompanyNamePrompt /> : <Onboarding />}
      <InstallPrompt />
      {install.dialog}
    </div>
  );
}

/** Full-screen state while auth is resolving, or when the account can't be used. */
function Gate({ status }: { status: ReturnType<typeof useAuth>["status"] }) {
  const message =
    status === "unconfigured"
      ? "Sign-in isn't set up yet. Add the Supabase URL and anon key to .env."
      : status === "no-company"
        ? "Your account isn't linked to a company yet. Ask your company owner to add you, or sign out and create a new account."
        : null;
  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6">
      <div className="max-w-sm text-center">
        <BrandMark className="mx-auto h-12 w-12 rounded-[13px]" />
        {message ? (
          <>
            <p className="mt-5 text-sm text-muted-foreground">{message}</p>
            {status === "no-company" && (
              <Button variant="outline" className="mt-5" onClick={() => void signOut()}>
                <LogOut className="h-4 w-4" /> Sign out
              </Button>
            )}
          </>
        ) : (
          <Loader2 className="mx-auto mt-6 h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>
    </div>
  );
}

/** Shows a loading skeleton until the company's data has arrived, or a retry on failure. */
function DataGate({ children }: { children: ReactNode }) {
  const ds = useDataStatus();
  if (ds.status === "ready") return <>{children}</>;
  if (ds.status === "error")
    return (
      <div className="rounded-2xl border border-dashed py-14 text-center">
        <p className="font-medium">Couldn't load your data</p>
        <p className="mt-1 text-sm text-muted-foreground">{ds.error}</p>
        {ds.orgId && (
          <Button className="mt-4" onClick={() => void loadData(ds.orgId!)}>
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        )}
      </div>
    );
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-14 rounded-2xl bg-muted" />
      <div className="h-72 rounded-2xl bg-muted" />
    </div>
  );
}

function Avatar({ name, small }: { name: string; small?: boolean }) {
  const initials = name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-brand font-semibold text-white",
        small ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm",
      )}
    >
      {initials || "?"}
    </span>
  );
}

function AccountMenu({
  children,
  side,
  install,
}: {
  children: ReactNode;
  side: "right" | "bottom";
  install?: (() => unknown) | undefined;
}) {
  const auth = useAuth();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent side={side} align="end" className="w-64 rounded-xl">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-semibold">{auth.fullName || "Your account"}</p>
          <p className="truncate text-xs text-muted-foreground">{auth.user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 font-normal text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span className="truncate">{auth.orgName}</span>
          {auth.role === "owner" && (
            <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
              Owner
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {install && (
          <DropdownMenuItem onSelect={install}>
            <Download className="h-4 w-4" /> Install app
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={openGuide}>
          <CircleHelp className="h-4 w-4" /> App guide
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => void signOut()}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Google sign-ups arrive without a company name; ask once before the welcome guide. */
function CompanyNamePrompt() {
  const auth = useAuth();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open>
      <DialogContent
        className="max-w-[calc(100vw-2rem)] rounded-3xl sm:max-w-md [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            setBusy(true);
            const error = await renameCompany(name.trim());
            setBusy(false);
            if (error) toast.error(error);
          }}
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/12 text-accent">
            <Building2 className="h-6 w-6" />
          </span>
          <DialogTitle className="text-2xl font-bold">
            Welcome{auth.fullName ? `, ${auth.fullName.split(" ")[0]}` : ""}
          </DialogTitle>
          <DialogDescription>
            What's your company called? Your team will see this name.
          </DialogDescription>
          <Input
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Trinova Analytics Ltd"
            className="h-11"
          />
          <Button type="submit" size="lg" className="h-11 w-full" disabled={busy || !name.trim()}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Continue
          </Button>
        </form>
      </DialogContent>
    </Dialog>
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
