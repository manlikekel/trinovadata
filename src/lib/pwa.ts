import { useSyncExternalStore } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

type State = {
  deferred: InstallEvent | null;
  installed: boolean;
  ios: boolean;
  dismissed: boolean;
};
const DISMISS_KEY = "trinova-install-dismissed";
const DISMISS_DAYS = 7;

let state: State = { deferred: null, installed: false, ios: false, dismissed: true };
const listeners = new Set<() => void>();
const emit = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

function wasDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - at < DISMISS_DAYS * 864e5;
  } catch {
    return false;
  }
}

let started = false;
/** Registers the service worker and listens for the browser's install offer. Call once on the client. */
export function initPwa() {
  if (started || typeof window === "undefined") return;
  started = true;
  const nav = navigator as Navigator & { standalone?: boolean };
  const ua = nav.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (ua.includes("Macintosh") && nav.maxTouchPoints > 1);
  const installed =
    window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
  emit({ ios, installed, dismissed: wasDismissed() });

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    emit({ deferred: e as InstallEvent });
  });
  window.addEventListener("appinstalled", () => emit({ installed: true, deferred: null }));

  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }
}

/** Shows the native install dialog (Android / desktop Chrome and Edge). Returns true if accepted. */
export async function promptInstall() {
  const e = state.deferred;
  if (!e) return false;
  await e.prompt();
  const { outcome } = await e.userChoice;
  emit({ deferred: null, installed: outcome === "accepted" || state.installed });
  return outcome === "accepted";
}

export function dismissInstall() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  emit({ dismissed: true });
}

export function usePwa() {
  const s = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
  return { ...s, canInstall: !s.installed && (!!s.deferred || s.ios) };
}
