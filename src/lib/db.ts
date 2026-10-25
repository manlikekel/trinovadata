import type { Job } from "./scoring";
import type { Category, Data, Vendor } from "./store";

/** Row shapes as stored in Supabase (see supabase/migrations). */
export type CategoryRow = { id: string; org_id: string; name: string };
export type VendorRow = {
  id: string;
  org_id: string;
  name: string;
  code: string;
  category_id: string | null;
  contact: string;
  contract_value: number | string;
  archived: boolean;
};
export type JobRow = {
  id: string;
  org_id: string;
  vendor_id: string;
  due_date: string;
  delivered_date: string;
  qty_ordered: number;
  qty_delivered: number;
  incident: boolean;
  hse_compliant: boolean;
  hse_notes: string;
  quality: number;
  notes: string;
};

export const fromCategory = (r: CategoryRow): Category => ({ id: r.id, name: r.name });
export const toCategory = (c: Category, orgId: string): CategoryRow => ({
  id: c.id,
  org_id: orgId,
  name: c.name,
});

export const fromVendor = (r: VendorRow): Vendor => ({
  id: r.id,
  name: r.name,
  code: r.code,
  categoryId: r.category_id ?? "",
  contact: r.contact,
  contractValue: Number(r.contract_value) || 0,
  archived: r.archived,
});
export const toVendor = (v: Vendor, orgId: string): VendorRow => ({
  id: v.id,
  org_id: orgId,
  name: v.name.trim(),
  code: v.code.trim(),
  category_id: v.categoryId || null,
  contact: v.contact.trim(),
  contract_value: v.contractValue || 0,
  archived: v.archived,
});

export const fromJob = (r: JobRow): Job => ({
  id: r.id,
  vendorId: r.vendor_id,
  dueDate: r.due_date,
  deliveredDate: r.delivered_date,
  qtyOrdered: r.qty_ordered,
  qtyDelivered: r.qty_delivered,
  incident: r.incident,
  hseCompliant: r.hse_compliant,
  hseNotes: r.hse_notes,
  quality: r.quality,
  notes: r.notes,
});
export const toJob = (j: Job, orgId: string): JobRow => ({
  id: j.id,
  org_id: orgId,
  vendor_id: j.vendorId,
  due_date: j.dueDate,
  delivered_date: j.deliveredDate,
  qty_ordered: j.qtyOrdered,
  qty_delivered: j.qtyDelivered,
  incident: j.incident,
  hse_compliant: j.hseCompliant,
  hse_notes: j.hseNotes ?? "",
  quality: j.quality,
  notes: j.notes ?? "",
});

/**
 * Prepares local data (demo data or data saved on a device before login) for import into a
 * company: every record gets a fresh id, and categories are matched to existing ones by name.
 */
export function planImport(source: Data, existing: Category[], newId: () => string) {
  const byName = new Map(existing.map((c) => [c.name.trim().toLowerCase(), c.id]));
  const catMap = new Map<string, string>();
  const categories: Category[] = [];
  for (const c of source.categories) {
    const key = c.name.trim().toLowerCase();
    let id = byName.get(key);
    if (!id) {
      id = newId();
      byName.set(key, id);
      categories.push({ id, name: c.name.trim() });
    }
    catMap.set(c.id, id);
  }
  const vendorMap = new Map<string, string>();
  const vendors: Vendor[] = source.vendors.map((v) => {
    const id = newId();
    vendorMap.set(v.id, id);
    return { ...v, id, categoryId: catMap.get(v.categoryId) ?? "" };
  });
  const jobs: Job[] = source.jobs
    .filter((j) => vendorMap.has(j.vendorId))
    .map((j) => ({ ...j, id: newId(), vendorId: vendorMap.get(j.vendorId)! }));
  return { categories, vendors, jobs };
}

/** Turns Postgres error codes into messages a user can act on. */
export function friendlyError(e: { code?: string; message?: string } | null | undefined): string {
  if (!e) return "Something went wrong";
  if (e.code === "23505") return "That name or vendor ID is already in use";
  if (e.code === "23503") return "This item is still in use by other records";
  if (e.code === "42501") return "You don't have permission to do that";
  if (e.message?.includes("Failed to fetch"))
    return "You're offline. Check your connection and try again";
  return e.message || "Something went wrong";
}
