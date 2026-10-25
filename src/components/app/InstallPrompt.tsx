import { useState } from "react";
import { Download, PlusSquare, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGuide } from "@/lib/onboarding";
import { dismissInstall, promptInstall, usePwa } from "@/lib/pwa";
import { BrandMark } from "./Brand";

function IosSteps() {
  return (
    <ol className="space-y-3 text-sm">
      <li className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted">
          <Share className="h-4 w-4" />
        </span>
        <span>
          Tap the <b>Share</b> button in Safari’s toolbar
        </span>
      </li>
      <li className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted">
          <PlusSquare className="h-4 w-4" />
        </span>
        <span>
          Choose <b>Add to Home Screen</b>, then tap <b>Add</b>
        </span>
      </li>
    </ol>
  );
}

/** Install action for menus: native prompt where supported, instructions on iOS. */
export function useInstallAction() {
  const pwa = usePwa();
  const [iosOpen, setIosOpen] = useState(false);
  const run = () => (pwa.deferred ? promptInstall() : setIosOpen(true));
  const dialog = (
    <Dialog open={iosOpen} onOpenChange={setIosOpen}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Install Trinova</DialogTitle>
          <DialogDescription>
            Add the app to your home screen for full-screen, one-tap access.
          </DialogDescription>
        </DialogHeader>
        <IosSteps />
      </DialogContent>
    </Dialog>
  );
  return { available: pwa.canInstall, run, dialog };
}

/** Floating install banner. Waits until the first-use guide is closed; snoozes for 7 days when dismissed. */
export function InstallPrompt() {
  const pwa = usePwa();
  const guide = useGuide();
  if (!pwa.canInstall || pwa.dismissed || guide.open) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+76px)] z-40 md:inset-x-auto md:bottom-6 md:right-6 md:w-96 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="rounded-2xl border bg-card p-4 shadow-float">
        <div className="flex items-start gap-3">
          <BrandMark className="h-11 w-11" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-[15px] font-semibold">Install Trinova</p>
            <p className="text-sm text-muted-foreground">
              {pwa.ios
                ? "Add it to your home screen for one-tap access."
                : "Full screen, faster, and works offline."}
            </p>
          </div>
          <button
            onClick={dismissInstall}
            aria-label="Not now"
            className="-m-1 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {pwa.ios ? (
          <div className="mt-4 rounded-xl bg-muted/60 p-3">
            <IosSteps />
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={dismissInstall}>
              Not now
            </Button>
            <Button
              className="flex-1"
              onClick={async () => {
                if (!(await promptInstall())) dismissInstall();
              }}
            >
              <Download className="h-4 w-4" /> Install
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
