import { useSyncExternalStore } from "react";

/**
 * First-use guide state.
 *
 * The guide is shown once per user. Until login exists everyone is the "guest" user.
 * When sign-in is added, call `setGuideUser(user.id, user.name)` right after a
 * successful login (and `setGuideUser(GUEST)` on logout): each user then sees the
 * guide the first time they sign in, and it never repeats for them on that device.
 */
export const GUEST = "guest";
const KEY = (user: string) => `trinova-guide-seen:${user}`;

type State = { open: boolean; user: string; name?: string | undefined };
let state: State = { open: false, user: GUEST };
const listeners = new Set<() => void>();
const emit = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

function seen(user: string) {
  try {
    return localStorage.getItem(KEY(user)) === "1";
  } catch {
    return true; // storage blocked: don't nag on every visit
  }
}

/** Sets who is using the app and opens the guide if they have not seen it yet. */
export function setGuideUser(user: string, name?: string) {
  emit({ user, name, open: typeof window !== "undefined" && !seen(user) });
}

/** Opens the guide for the current user if they have not completed it. */
export function maybeStartGuide() {
  if (!state.open && !seen(state.user)) emit({ open: true });
}

export function openGuide() {
  emit({ open: true });
}

export function closeGuide() {
  try {
    localStorage.setItem(KEY(state.user), "1");
  } catch {
    /* ignore */
  }
  emit({ open: false });
}

export function useGuide() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => state,
  );
}
