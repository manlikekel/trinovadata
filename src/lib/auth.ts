import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { clearGuideUser, setGuideUser } from "./onboarding";
import { loadData, resetData } from "./store";
import { supabase, supabaseConfigured } from "./supabase";

export type AuthState = {
  status: "loading" | "signed-out" | "signed-in" | "no-company" | "unconfigured";
  user: User | null;
  orgId: string | null;
  orgName: string;
  fullName: string;
  role: "owner" | "member" | null;
};

const initial: AuthState = {
  status: supabaseConfigured ? "loading" : "unconfigured",
  user: null,
  orgId: null,
  orgName: "",
  fullName: "",
  role: null,
};
let state = initial;
const listeners = new Set<() => void>();
const set = (next: Partial<AuthState>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

let currentUserId: string | null = null;

async function onUser(user: User | null) {
  if (!user) {
    currentUserId = null;
    resetData();
    clearGuideUser();
    set({ ...initial, status: "signed-out" });
    return;
  }
  if (user.id === currentUserId) {
    set({ user }); // token refresh or profile update
    return;
  }
  currentUserId = user.id;
  set({ status: "loading", user });
  const { data, error } = await supabase()
    .from("memberships")
    .select("org_id, role, full_name, organizations(name)")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (currentUserId !== user.id) return; // signed out meanwhile
  if (error || !data) {
    set({ status: "no-company" });
    return;
  }
  const org = data.organizations as unknown as { name: string } | null;
  const fullName = data.full_name || (user.user_metadata?.["full_name"] as string) || "";
  set({
    status: "signed-in",
    orgId: data.org_id,
    orgName: org?.name ?? "",
    fullName,
    role: data.role as AuthState["role"],
  });
  setGuideUser(user.id, fullName.split(" ")[0] || undefined);
  void loadData(data.org_id);
}

let started = false;
/** Starts listening to Supabase auth. Safe to call many times; only runs in the browser. */
export function initAuth() {
  if (started || typeof window === "undefined" || !supabaseConfigured) return;
  started = true;
  const sb = supabase();
  sb.auth.onAuthStateChange((_event, session) => {
    // Supabase recommends not awaiting other Supabase calls inside this callback.
    setTimeout(() => void onUser(session?.user ?? null), 0);
  });
}

export function useAuth(): AuthState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => initial,
  );
}

export async function signOut() {
  await supabase().auth.signOut();
}

/** Owners can rename their company. */
export async function renameCompany(name: string) {
  if (!state.orgId) return "Not signed in";
  const { error } = await supabase().from("organizations").update({ name }).eq("id", state.orgId);
  if (error) return error.message;
  set({ orgName: name });
  return null;
}

/** Placeholder name the database gives a company created without one. */
export const UNNAMED_COMPANY = "My company";
