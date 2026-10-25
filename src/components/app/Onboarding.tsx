import { useState } from "react";
import { BellRing, ClipboardList, Download, Gauge, Medal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { closeGuide, useGuide } from "@/lib/onboarding";
import { promptInstall, usePwa } from "@/lib/pwa";
import { cn } from "@/lib/utils";

type Step = { icon: typeof Gauge; title: string; body: string; points?: string[] };

const steps = (name?: string): Step[] => [
  {
    icon: Sparkles,
    title: name ? `Welcome, ${name}` : "Welcome to Trinova",
    body: "Move from gut feel to data. Trinova scores every vendor on real job records and warns you before a weak vendor costs you.",
  },
  {
    icon: ClipboardList,
    title: "1. Log every job",
    body: "Open a vendor and tap Log job after each delivery or service.",
    points: [
      "Due date vs delivered date",
      "Quantity ordered vs delivered",
      "Damage or incidents, HSE compliance, quality 1–5",
    ],
  },
  {
    icon: Gauge,
    title: "2. Scores update automatically",
    body: "Each vendor gets an overall score out of 100.",
    points: ["50% on-time-in-full (OTIF)", "30% damage and incident-free", "20% HSE compliance"],
  },
  {
    icon: Medal,
    title: "3. Tiers drive action",
    body: "Vendors are ranked on the scoreboard by tier.",
    points: [
      "Elite (95+): reward and priority jobs",
      "Standard (85–94): normal monitoring",
      "At-Risk (below 85): warning, review and action plan",
    ],
  },
  {
    icon: BellRing,
    title: "4. Watch early warnings",
    body: "The Early warnings page lists vendors that are at risk or whose score fell sharply versus the previous period. Check it weekly.",
  },
  {
    icon: Download,
    title: "Take it with you",
    body: "Install Trinova on your phone, tablet or computer for one-tap access, full screen and offline use. You can reopen this guide any time from the Help button.",
  },
];

export function Onboarding() {
  const { open, name } = useGuide();
  const pwa = usePwa();
  const [i, setI] = useState(0);
  const all = steps(name);
  const list = pwa.canInstall ? all : all.slice(0, -1);
  const step = list[Math.min(i, list.length - 1)]!;
  const last = i >= list.length - 1;
  const finish = () => {
    closeGuide();
    setI(0);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && finish()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-3xl border-0 p-0 sm:max-w-md">
        <div className="bg-hero px-6 pb-8 pt-10 text-primary-foreground">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/12 ring-1 ring-white/20 backdrop-blur">
            <step.icon className="h-7 w-7 text-accent" />
          </div>
          <DialogTitle className="mt-5 text-2xl font-bold">{step.title}</DialogTitle>
        </div>
        <div className="px-6 pb-6 pt-5">
          <DialogDescription className="text-[15px] leading-relaxed text-foreground/80">
            {step.body}
          </DialogDescription>
          {step.points && (
            <ul className="mt-4 space-y-2">
              {step.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {p}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6 flex items-center justify-center gap-1.5" aria-hidden="true">
            {list.map((_, n) => (
              <span
                key={n}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  n === i ? "w-6 bg-primary" : "w-1.5 bg-border",
                )}
              />
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            {i === 0 ? (
              <Button variant="ghost" className="flex-1" onClick={finish}>
                Skip
              </Button>
            ) : (
              <Button variant="outline" className="flex-1" onClick={() => setI(i - 1)}>
                Back
              </Button>
            )}
            {!last && (
              <Button className="flex-1" onClick={() => setI(i + 1)}>
                Next
              </Button>
            )}
            {last && pwa.canInstall && pwa.deferred && (
              <Button
                className="flex-1"
                onClick={async () => {
                  await promptInstall();
                  finish();
                }}
              >
                Install app
              </Button>
            )}
            {last && !(pwa.canInstall && pwa.deferred) && (
              <Button className="flex-1" onClick={finish}>
                Get started
              </Button>
            )}
          </div>
          {last && pwa.canInstall && pwa.ios && (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              On iPhone or iPad: tap Share, then “Add to Home Screen”.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
