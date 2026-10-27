import { appendFileSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function refreshNeeded(generatedAt, event, slot, now = Date.now()) {
  const timestamp = Date.parse(generatedAt);
  if (!Number.isFinite(timestamp) || timestamp > now + 60_000) return true;
  if (slot) {
    const target = Date.parse(slot);
    if (!Number.isFinite(target) || new Date(target).toISOString() !== slot || target > now + 60_000) {
      throw new Error("Invalid refresh slot");
    }
    return timestamp < target;
  }
  // Manual refreshes still run on demand. This guard prevents the backup cron
  // from repeating ingestion right after the external scheduler finishes.
  return event !== "schedule" || now - timestamp >= 45 * 60_000;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let generatedAt;
  try { generatedAt = JSON.parse(readFileSync("public/summary.json", "utf8")).generatedAt; }
  catch { /* A missing snapshot must be regenerated. */ }
  const needed = refreshNeeded(generatedAt, process.env.GITHUB_EVENT_NAME, process.env.REFRESH_SLOT);
  if (!process.env.GITHUB_OUTPUT) throw new Error("GitHub Actions output path is missing");
  appendFileSync(process.env.GITHUB_OUTPUT, `needed=${needed}\n`);
  console.log(needed ? "A job refresh is needed." : "This hourly snapshot is already current.");
}
