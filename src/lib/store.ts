import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  friendlyError,
  fromCategory,
  fromJob,
  fromVendor,
  planImport,
  toCategory,
  toJob,
  toVendor,
  type CategoryRow,
  type JobRow,
  type VendorRow,
} from "./db";
import { sampleData } from "./sample";
import type { Job } from "./scoring";
import { supabase } from "./supabase";

export type Category = { id: string; name: string };
export type Vendor = {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  contact: string;
  contractValue: number;
  archived: boolean;
};
export type Data = { categories: Category[]; vendors: Vendor[]; jobs: Job[] };
export type DataStatus = "idle" | "loading" | "ready" | "error";

export const uid = () => crypto.randomUUID();

/* ---------------------------------------------------------------- state */

const empty: Data = { categories: [], vendors: [], jobs: [] };
let data: Data = empty;
let status: { status: DataStatus; orgId: string | null; error?: string } = {
  status: "idle",
  orgId: null,
};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useData(): Data {
  return useSyncExternalStore(
    subscribe,
    () => data,
    () => empty,
  );
}

export function useDataStatus() {
  return useSyncExternalStore(
    subscribe,
    () => status,
    () => status,
  );
}

/* ---------------------------------------------------------------- loading */

const PAGE = 1000;

async function fetchAll<T>(table: string, orgId: string, order: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: rows, error } = await supabase()
      .from(table)
      .select("*")
      .eq("org_id", orgId)
      .order(order)
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(rows as T[]));
    if (!rows || rows.length < PAGE) return out;
  }
}

/** Loads all categories, vendors and jobs for a company. Called after sign-in. */
export async function loadData(orgId: string) {
  status = { status: "loading", orgId };
  emit();
  try {
    const [cats, vendors, jobs] = await Promise.all([
      fetchAll<CategoryRow>("categories", orgId, "created_at"),
      fetchAll<VendorRow>("vendors", orgId, "name"),
      fetchAll<JobRow>("jobs", orgId, "due_date"),
    ]);
    data = {
      categories: cats.map(fromCategory),
      vendors: vendors.map(fromVendor),
      jobs: jobs.map(fromJob),
    };
    status = { status: "ready", orgId };
  } catch (e) {
    status = { status: "error", orgId, error: friendlyError(e as { message?: string }) };
  }
  emit();
}

export function resetData() {
  data = empty;
  status = { status: "idle", orgId: null };
  emit();
}

const org = () => {
  if (!status.orgId) throw new Error("Not signed in");
  return status.orgId;
};

/**
 * Applies a change on screen immediately, then saves it. If saving fails the screen is
 * restored and the user sees why.
 */
async function mutate(
  optimistic: (d: Data) => Data,
  save: () => PromiseLike<{ error: { code?: string; message?: string } | null }>,
): Promise<boolean> {
  const before = data;
  data = optimistic(data);
  emit();
  const { error } = await save();
  if (error) {
    if (data !== before) {
      data = before;
      emit();
    }
    toast.error(friendlyError(error));
    return false;
  }
  return true;
}

/* ---------------------------------------------------------------- actions */

export function addCategory(name: string) {
  const c = { id: uid(), name: name.trim() };
  return mutate(
    (d) => ({ ...d, categories: [...d.categories, c] }),
    () => supabase().from("categories").insert(toCategory(c, org())),
  );
}

export function renameCategory(id: string, name: string) {
  return mutate(
    (d) => ({ ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, name } : c)) }),
    () => supabase().from("categories").update({ name }).eq("id", id),
  );
}

export function deleteCategory(id: string) {
  return mutate(
    (d) => ({ ...d, categories: d.categories.filter((c) => c.id !== id) }),
    () => supabase().from("categories").delete().eq("id", id),
  );
}

/** Creates the vendor when `isNew`, otherwise updates it. */
export function saveVendor(v: Vendor, isNew: boolean) {
  const vendor = isNew ? { ...v, id: uid() } : v;
  return mutate(
    (d) => ({
      ...d,
      vendors: isNew
        ? [...d.vendors, vendor]
        : d.vendors.map((x) => (x.id === vendor.id ? vendor : x)),
    }),
    () =>
      isNew
        ? supabase().from("vendors").insert(toVendor(vendor, org()))
        : supabase().from("vendors").update(toVendor(vendor, org())).eq("id", vendor.id),
  );
}

export function setVendorArchived(id: string, archived: boolean) {
  return mutate(
    (d) => ({ ...d, vendors: d.vendors.map((v) => (v.id === id ? { ...v, archived } : v)) }),
    () => supabase().from("vendors").update({ archived }).eq("id", id),
  );
}

/** Creates the job when `isNew`, otherwise updates it. */
export function saveJob(j: Job, isNew: boolean) {
  const job = isNew ? { ...j, id: uid() } : j;
  return mutate(
    (d) => ({
      ...d,
      jobs: isNew ? [...d.jobs, job] : d.jobs.map((x) => (x.id === job.id ? job : x)),
    }),
    () =>
      isNew
        ? supabase().from("jobs").insert(toJob(job, org()))
        : supabase().from("jobs").update(toJob(job, org())).eq("id", job.id),
  );
}

export function deleteJob(id: string) {
  return mutate(
    (d) => ({ ...d, jobs: d.jobs.filter((j) => j.id !== id) }),
    () => supabase().from("jobs").delete().eq("id", id),
  );
}

async function insertChunks(table: string, rows: object[]) {
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase()
      .from(table)
      .insert(rows.slice(i, i + 500));
    if (error) throw error;
  }
}

/** Adds local data (demo or saved on this device) to the signed-in company. */
export async function importData(source: Data) {
  const orgId = org();
  const plan = planImport(source, data.categories, uid);
  try {
    await insertChunks(
      "categories",
      plan.categories.map((c) => toCategory(c, orgId)),
    );
    await insertChunks(
      "vendors",
      plan.vendors.map((v) => toVendor(v, orgId)),
    );
    await insertChunks(
      "jobs",
      plan.jobs.map((j) => toJob(j, orgId)),
    );
  } catch (e) {
    toast.error(friendlyError(e as { message?: string }));
    await loadData(orgId);
    return false;
  }
  await loadData(orgId);
  return true;
}

/** Deletes every vendor and job in the company (jobs cascade with their vendor). */
export async function clearAll() {
  const orgId = org();
  const { error } = await supabase().from("vendors").delete().eq("org_id", orgId);
  if (error) {
    toast.error(friendlyError(error));
    return false;
  }
  await loadData(orgId);
  return true;
}

export async function loadDemoData() {
  return (await clearAll()) && importData(sampleData());
}

/* ---------------------------------------------------------------- data saved before login */

const LOCAL_KEY = "trinova-scorecard-v1";

/** Data a browser saved before accounts existed, if any. */
export function localData(): Data | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    const d = raw ? (JSON.parse(raw) as Data) : null;
    return d && Array.isArray(d.vendors) && d.vendors.length ? d : null;
  } catch {
    return null;
  }
}

export function forgetLocalData() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) localStorage.setItem(`${LOCAL_KEY}-imported`, raw);
    localStorage.removeItem(LOCAL_KEY);
  } catch {
    /* ignore */
  }
}

/* ---------------------------------------------------------------- export */

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (c: string | number) => {
    const t = String(c);
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
