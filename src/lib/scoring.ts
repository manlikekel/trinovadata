export type Job = {
  id: string;
  vendorId: string;
  dueDate: string; // yyyy-mm-dd
  deliveredDate: string; // yyyy-mm-dd
  qtyOrdered: number;
  qtyDelivered: number;
  incident: boolean;
  hseCompliant: boolean;
  quality: number; // 1-5
  hseNotes?: string;
  notes?: string;
};

export type Tier = "elite" | "standard" | "at-risk" | "none";

export const WEIGHTS = { otif: 0.5, safety: 0.3, hse: 0.2 };

export function isOtif(job: Job): boolean {
  const onTime = job.deliveredDate <= job.dueDate;
  const inFull = job.qtyDelivered >= job.qtyOrdered;
  return onTime && inFull;
}

export type Score = {
  jobs: number;
  otif: number;
  safety: number;
  hse: number;
  overall: number;
  late: number;
  incidents: number;
  quality: number; // average 1-5
  tier: Tier;
};

export function tierFor(overall: number, jobs: number): Tier {
  if (jobs === 0) return "none";
  if (overall >= 95) return "elite";
  if (overall >= 85) return "standard";
  return "at-risk";
}

export function scoreJobs(jobs: Job[]): Score {
  const n = jobs.length;
  if (n === 0)
    return {
      jobs: 0,
      otif: 0,
      safety: 0,
      hse: 0,
      overall: 0,
      late: 0,
      incidents: 0,
      quality: 0,
      tier: "none",
    };
  const otifCount = jobs.filter(isOtif).length;
  const incidents = jobs.filter((j) => j.incident).length;
  const hseCount = jobs.filter((j) => j.hseCompliant).length;
  const late = jobs.filter((j) => j.deliveredDate > j.dueDate).length;
  const otif = (otifCount / n) * 100;
  const safety = ((n - incidents) / n) * 100;
  const hse = (hseCount / n) * 100;
  const quality = jobs.reduce((a, j) => a + j.quality, 0) / n;
  const overall =
    Math.round((otif * WEIGHTS.otif + safety * WEIGHTS.safety + hse * WEIGHTS.hse) * 10) / 10;
  return {
    jobs: n,
    otif,
    safety,
    hse,
    overall,
    late,
    incidents,
    quality,
    tier: tierFor(overall, n),
  };
}

export const isoDaysAgo = (days: number, from = new Date()) =>
  new Date(from.getTime() - days * 864e5).toISOString().slice(0, 10);

/** Scores the last `days` days and the `days` before that, for trend comparison. */
export function comparePeriods(jobs: Job[], days: number, from = new Date()) {
  const start = isoDaysAgo(days, from);
  const prevStart = isoDaysAgo(days * 2, from);
  return {
    current: scoreJobs(jobs.filter((j) => j.dueDate >= start)),
    previous: scoreJobs(jobs.filter((j) => j.dueDate >= prevStart && j.dueDate < start)),
  };
}

/** A sharp fall is a drop of this many points or more versus the previous period. */
export const SHARP_DROP = 5;

export const tierLabel: Record<Tier, string> = {
  elite: "Elite",
  standard: "Standard",
  "at-risk": "At-Risk",
  none: "No data",
};

export const tierAction: Record<Tier, string> = {
  elite: "Eligible for performance bonus and priority job allocation.",
  standard: "Normal operation with standard monitoring.",
  "at-risk":
    "Warning issued. Hold high-value jobs, schedule a review and request a corrective action plan.",
  none: "Log jobs to start scoring this vendor.",
};
