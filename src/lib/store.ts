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
  "Oil & gas services",
  "Logistics & dispatch",
  "Equipment supply",
  "Maintenance",
  "HSE services",
  "IT services",
  "Catering",
  "Security",
].map((name, i) => ({ id: `c${i}`, name }));

function day(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

type Profile = {
  late: number;
  short: number;
  inc: number;
  hse: number;
  perWeek: number;
  slipping?: boolean;
};

// Demo vendors. Rates are per-job probabilities; `slipping` vendors get worse over the
// last 8 weeks so the early-warning page has a sharp fall to show.
const SAMPLE: [Omit<Vendor, "archived">, Profile][] = [
  [
    {
      id: "v1",
      name: "Deltaline Drilling Services",
      code: "VN-104",
      categoryId: "c0",
      contact: "ops@deltaline.ng",
      contractValue: 45000000,
    },
    { late: 0.02, short: 0, inc: 0, hse: 1, perWeek: 1 },
  ],
  [
    {
      id: "v2",
      name: "SwiftRide Dispatch",
      code: "VN-212",
      categoryId: "c1",
      contact: "0803 000 0000",
      contractValue: 3500000,
    },
    { late: 0.08, short: 0.02, inc: 0.03, hse: 0.95, perWeek: 2 },
  ],
  [
    {
      id: "v3",
      name: "Bonny Marine Logistics",
      code: "VN-089",
      categoryId: "c1",
      contact: "info@bonnymarine.ng",
      contractValue: 12000000,
    },
    { late: 0.3, short: 0.1, inc: 0.15, hse: 0.7, perWeek: 1 },
  ],
  [
    {
      id: "v4",
      name: "Niger Valve & Pipe Supply",
      code: "VN-131",
      categoryId: "c2",
      contact: "sales@nvps.ng",
      contractValue: 20000000,
    },
    { late: 0.1, short: 0.05, inc: 0.05, hse: 0.9, perWeek: 1 },
  ],
  [
    {
      id: "v5",
      name: "Rivers Crane & Lifting",
      code: "VN-145",
      categoryId: "c3",
      contact: "lifting@riverscrane.ng",
      contractValue: 28000000,
    },
    { late: 0.03, short: 0, inc: 0.01, hse: 0.98, perWeek: 1 },
  ],
  [
    {
      id: "v6",
      name: "SafeGuard HSE Consult",
      code: "VN-160",
      categoryId: "c4",
      contact: "hse@safeguard.ng",
      contractValue: 8500000,
    },
    { late: 0.01, short: 0, inc: 0, hse: 1, perWeek: 1 },
  ],
  [
    {
      id: "v7",
      name: "Onne Tech Systems",
      code: "VN-178",
      categoryId: "c5",
      contact: "support@onnetech.ng",
      contractValue: 6000000,
    },
    { late: 0.12, short: 0.03, inc: 0.01, hse: 0.97, perWeek: 1 },
  ],
  [
    {
      id: "v8",
      name: "Eko Catering Services",
      code: "VN-190",
      categoryId: "c6",
      contact: "0809 111 2233",
      contractValue: 4200000,
    },
    { late: 0.05, short: 0.03, inc: 0.02, hse: 0.95, perWeek: 2, slipping: true },
  ],
  [
    {
      id: "v9",
      name: "Sentinel Security Ltd",
      code: "VN-203",
      categoryId: "c7",
      contact: "control@sentinel.ng",
      contractValue: 9600000,
    },
    { late: 0.02, short: 0, inc: 0.02, hse: 0.98, perWeek: 1 },
  ],
  [
    {
      id: "v10",
      name: "Warri Pipeline Maintenance",
      code: "VN-221",
      categoryId: "c3",
      contact: "works@warripipeline.ng",
      contractValue: 33000000,
    },
    { late: 0.06, short: 0.04, inc: 0.04, hse: 0.92, perWeek: 1, slipping: true },
  ],
];

const HSE_MISSES = [
  "No hard hat on site",
  "Permit to work not signed",
  "Missing hi-vis vest",
  "No toolbox talk held",
  "Gas test not recorded",
];
const INCIDENTS = [
  "Goods damaged in transit",
  "Minor near miss reported",
  "Spill during offload",
  "Equipment dropped",
];

function sample(): Data {
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const pick = <T>(list: T[]) => list[Math.floor(rnd() * list.length)]!;
  const vendors: Vendor[] = SAMPLE.map(([v]) => ({ ...v, archived: false }));
  const jobs: Job[] = [];
  for (const [v, p] of SAMPLE) {
    for (let week = 0; week < 26; week++) {
      const worse = p.slipping && week < 8 ? 4 : 1;
      for (let k = 0; k < p.perWeek; k++) {
        const offset = -week * 7 - 1 - k * 3;
        const late = rnd() < p.late * worse;
        const ordered = 5 + Math.floor(rnd() * 16);
        const short = rnd() < p.short * worse;
        const incident = rnd() < p.inc * worse;
        const hseCompliant = rnd() >= (1 - p.hse) * worse;
        jobs.push({
          id: uid(),
          vendorId: v.id,
          dueDate: day(offset),
          deliveredDate: late ? day(offset + 1 + Math.floor(rnd() * 3)) : day(offset),
          qtyOrdered: ordered,
          qtyDelivered: short ? ordered - 1 - Math.floor(rnd() * 2) : ordered,
          incident,
          hseCompliant,
          hseNotes: hseCompliant ? "" : pick(HSE_MISSES),
          notes: incident ? pick(INCIDENTS) : "",
          quality: late || incident ? 3 : short ? 4 : 5 - (rnd() < 0.15 ? 1 : 0),
        });
      }
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

export function clearAll() {
  update(() => ({ categories: DEFAULT_CATEGORIES, vendors: [], jobs: [] }));
}

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

export function resetToSample() {
  update(() => sample());
}

export function useData(): Data {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    load,
    () => empty,
  );
}
