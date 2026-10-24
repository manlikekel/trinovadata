import { useSyncExternalStore } from "react";
import type { Job } from "./scoring";

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

const KEY = "trinova-scorecard-v1";
export const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_CATEGORIES = [
  "Oil & gas services", "Logistics & dispatch", "Equipment supply", "Maintenance",
  "HSE services", "IT services", "Catering", "Security",
].map((name, i) => ({ id: `c${i}`, name }));

function day(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function sample(): Data {
  const vendors: Vendor[] = [
    { id: "v1", name: "Deltaline Drilling Services", code: "VN-104", categoryId: "c0", contact: "ops@deltaline.ng", contractValue: 45000000, archived: false },
    { id: "v2", name: "SwiftRide Dispatch", code: "VN-212", categoryId: "c1", contact: "0803 000 0000", contractValue: 3500000, archived: false },
    { id: "v3", name: "Bonny Marine Logistics", code: "VN-089", categoryId: "c1", contact: "info@bonnymarine.ng", contractValue: 12000000, archived: false },
    { id: "v4", name: "Niger Valve & Pipe Supply", code: "VN-131", categoryId: "c2", contact: "sales@nvps.ng", contractValue: 20000000, archived: false },
  ];
  const profile: Record<string, { late: number; short: number; inc: number; hse: number }> = {
    v1: { late: 0.02, short: 0, inc: 0, hse: 1 },
    v2: { late: 0.08, short: 0.02, inc: 0.03, hse: 0.95 },
    v3: { late: 0.3, short: 0.1, inc: 0.15, hse: 0.7 },
    v4: { late: 0.1, short: 0.05, inc: 0.05, hse: 0.9 },
  };
  const jobs: Job[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (const v of vendors) {
    const p = profile[v.id];
    for (let i = 0; i < 24; i++) {
      const due = day(-i * 7 - 2);
      const late = rnd() < p.late;
      jobs.push({
        id: uid(), vendorId: v.id, dueDate: due,
        deliveredDate: late ? day(-i * 7 + 1) : due,
        qtyOrdered: 10, qtyDelivered: rnd() < p.short ? 8 : 10,
        incident: rnd() < p.inc, hseCompliant: rnd() < p.hse,
        quality: late ? 3 : 5,
      });
    }
  }
  return { categories: DEFAULT_CATEGORIES, vendors, jobs };
}

let state: Data | null = null;
const listeners = new Set<() => void>();
const empty: Data = { categories: [], vendors: [], jobs: [] };

function load(): Data {
  if (state) return state;
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : sample();
  } catch {
    state = sample();
  }
  return state!;
}

export function update(fn: (d: Data) => Data) {
  state = fn(load());
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function resetToSample() {
  update(() => sample());
}

export function useData(): Data {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    load,
    () => empty,
  );
}
