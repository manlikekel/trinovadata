import { describe, expect, it } from "vitest";
import { friendlyError, fromJob, fromVendor, planImport, toJob, toVendor } from "./db";
import { sampleData } from "./sample";
import type { Job } from "./scoring";
import type { Vendor } from "./store";

const vendor: Vendor = {
  id: "v",
  name: " Deltaline ",
  code: " VN-1 ",
  categoryId: "",
  contact: "",
  contractValue: 0,
  archived: false,
};
const job: Job = {
  id: "j",
  vendorId: "v",
  dueDate: "2026-10-01",
  deliveredDate: "2026-10-02",
  qtyOrdered: 10,
  qtyDelivered: 9,
  incident: true,
  hseCompliant: false,
  quality: 3,
};

describe("row mapping", () => {
  it("round-trips vendors, trimming text and storing no category as null", () => {
    const row = toVendor(vendor, "org");
    expect(row).toMatchObject({
      org_id: "org",
      name: "Deltaline",
      code: "VN-1",
      category_id: null,
    });
    expect(fromVendor({ ...row, contract_value: "1500.50" })).toMatchObject({
      categoryId: "",
      contractValue: 1500.5,
    });
  });
  it("round-trips jobs with empty notes", () => {
    const row = toJob(job, "org");
    expect(row).toMatchObject({ vendor_id: "v", hse_notes: "", notes: "", qty_delivered: 9 });
    expect(fromJob(row)).toEqual({ ...job, hseNotes: "", notes: "" });
  });
});

describe("planImport", () => {
  let n = 0;
  const newId = () => `id${++n}`;

  it("reuses existing categories by name and re-links every record to new ids", () => {
    const demo = sampleData();
    const existing = [{ id: "real-maint", name: "maintenance" }];
    const plan = planImport(demo, existing, newId);
    expect(plan.categories).toHaveLength(7);
    expect(plan.vendors).toHaveLength(10);
    expect(plan.jobs).toHaveLength(demo.jobs.length);
    const ids = new Set(plan.vendors.map((v) => v.id));
    expect(plan.jobs.every((j) => ids.has(j.vendorId))).toBe(true);
    expect(plan.vendors.find((v) => v.name === "Rivers Crane & Lifting")?.categoryId).toBe(
      "real-maint",
    );
  });
  it("drops jobs whose vendor is missing", () => {
    const plan = planImport({ categories: [], vendors: [], jobs: [job] }, [], newId);
    expect(plan.jobs).toHaveLength(0);
  });
});

describe("friendlyError", () => {
  it("explains duplicates and offline errors", () => {
    expect(friendlyError({ code: "23505" })).toMatch(/already in use/);
    expect(friendlyError({ message: "TypeError: Failed to fetch" })).toMatch(/offline/);
  });
});
