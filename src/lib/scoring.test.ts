import { describe, expect, it } from "vitest";
import { scoreJobs, tierFor, isOtif, type Job } from "./scoring";

const job = (p: Partial<Job> = {}): Job => ({
  id: "1", vendorId: "v", dueDate: "2026-01-10", deliveredDate: "2026-01-10",
  qtyOrdered: 10, qtyDelivered: 10, incident: false, hseCompliant: true, quality: 5, ...p,
});

describe("scoring", () => {
  it("fails OTIF when on time but not in full", () => {
    expect(isOtif(job({ qtyDelivered: 9 }))).toBe(false);
  });
  it("fails OTIF when late", () => {
    expect(isOtif(job({ deliveredDate: "2026-01-11" }))).toBe(false);
  });
  it("weights OTIF 50%, safety 30%, HSE 20%", () => {
    // 2 jobs: one OTIF fail -> otif 50, safety 100, hse 50 => 25+30+10 = 65
    const s = scoreJobs([job(), job({ deliveredDate: "2026-01-12", hseCompliant: false })]);
    expect(s.overall).toBe(65);
  });
  it("tiers: 95 elite, 85 standard, 84.9 at-risk", () => {
    expect(tierFor(95, 1)).toBe("elite");
    expect(tierFor(85, 1)).toBe("standard");
    expect(tierFor(84.9, 1)).toBe("at-risk");
  });
});
