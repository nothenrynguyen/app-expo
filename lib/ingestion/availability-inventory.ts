import type { PublicJob } from "../jobs";

// Use already-established public ID aliases, never title similarity, to avoid
// counting the same saved opportunity twice or showing it in both states.
export function availabilityInventory(current: PublicJob[], held: PublicJob[], aliases: Record<string, string>) {
  const canonical = (id: string) => aliases[id] ?? id;
  const heldIds = new Set(held.map(job => canonical(job.id)));
  if (heldIds.size !== held.length) throw new Error("Duplicate held opportunity aliases require review.");
  const groups = Map.groupBy(current.filter(job => !heldIds.has(canonical(job.id))), job => canonical(job.id));
  return [...groups].map(([id, rows]) => {
    const preferred = rows.find(job => job.id === id) ?? rows[0];
    const previousIds = [...new Set(rows.flatMap(job => [job.id, ...(job.previousIds ?? [])]))].filter(old => old !== id);
    return {...preferred, id, ...(previousIds.length ? {previousIds} : {}), sources: [...new Set(rows.flatMap(job => job.sources))]};
  });
}
