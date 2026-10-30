import { createAtsBoard, discoverAtsBoard, type AtsBoard, type AtsBoardSeed } from "../ats-boards";
import type { PublicJob } from "../jobs";
import type { BoardRefreshDiagnostic } from "./types";

export type KnownBoard = AtsBoardSeed & { apiHost?: "api.lever.co" | "api.eu.lever.co"; lastDiscoveredAt: string; lastHealthyAt?: string };
export type BoardHistory = { version: 1; boards: KnownBoard[] };
const RETENTION_MS = 90 * 86_400_000;
// Permission holds can move previously discovered boards into retention without
// increasing the total request count. Keep the independent total cap unchanged.
export const MAX_RETAINED_BOARDS = 400;
export const MAX_REFRESH_BOARDS = 1_000;

function restore(record: KnownBoard): AtsBoard {
  if (!["greenhouse", "lever", "ashby"].includes(record.provider) || !record.key?.trim() || !record.company?.trim()
    || !Number.isFinite(Date.parse(record.lastDiscoveredAt))
    || (record.lastHealthyAt !== undefined && !Number.isFinite(Date.parse(record.lastHealthyAt)))) throw new Error("Invalid employer board history");
  const board = createAtsBoard(record, "Retained ATS");
  if (record.provider === "lever" && record.apiHost === "api.eu.lever.co") {
    board.id = `lever:api.eu.lever.co:${board.key.toLowerCase()}`;
    board.endpoint = `https://api.eu.lever.co/v0/postings/${encodeURIComponent(board.key)}?mode=json&limit=1000`;
  } else if (record.apiHost && record.apiHost !== "api.lever.co") throw new Error("Invalid employer board API host");
  return board;
}

function remember(board: AtsBoard, lastDiscoveredAt: string): KnownBoard {
  return { provider: board.provider, key: board.key, company: board.company,
    ...(board.provider === "lever" ? { apiHost: new URL(board.endpoint).hostname as KnownBoard["apiHost"] } : {}), lastDiscoveredAt };
}

// History supplies discovery only. It grants no employer trust and stores no old jobs.
export function selectRefreshBoards(discovered: Iterable<AtsBoard>, history: BoardHistory,
  previousJobs: PublicJob[], now = new Date(), retired = new Set<string>()) {
  if (history.version !== 1 || !Array.isArray(history.boards)) throw new Error("Invalid employer board history");
  const records = new Map<string, KnownBoard>();
  for (const record of history.boards) {
    const board = restore(record);
    if (retired.has(board.id)) continue;
    const lastActive = Math.max(Date.parse(record.lastDiscoveredAt), Date.parse(record.lastHealthyAt ?? record.lastDiscoveredAt));
    if (lastActive > now.getTime() + 60_000) throw new Error("Future employer board history timestamp");
    if (now.getTime() - lastActive <= RETENTION_MS) records.set(board.id, record);
  }
  // Bootstrap published boards only when no history exists. Preserved jobs must
  // not extend retention forever on repeated source failures.
  for (const job of history.boards.length === 0 ? previousJobs : []) {
    const board = discoverAtsBoard(job.applyUrl, job.company, "Previous published ATS");
    if (board && !retired.has(board.id) && !records.has(board.id)) records.set(board.id, remember(board, now.toISOString()));
  }
  const current = new Map([...discovered].filter(board => !retired.has(board.id)).map(board => [board.id, board]));
  for (const board of current.values()) records.set(board.id, { ...records.get(board.id), ...remember(board, now.toISOString()) });
  const retained = [...records].filter(([id]) => !current.has(id));
  if (retained.length > MAX_RETAINED_BOARDS || records.size > MAX_REFRESH_BOARDS) {
    throw new Error(`Employer board budget exceeded: ${retained.length} retained, ${records.size} total. Review coverage before publishing.`);
  }
  const boards = [...current.values(), ...retained.map(([, record]) => restore(record))];
  return { boards, history: { version: 1 as const, boards: [...records.values()].sort((a, b) => restore(a).id.localeCompare(restore(b).id)) },
    discovered: current.size, retained: retained.length };
}

export function completeBoardHistory(history: BoardHistory, diagnostics: BoardRefreshDiagnostic[], now = new Date()): BoardHistory {
  const id = (r: BoardRefreshDiagnostic) => r.id ?? createAtsBoard({ ...r, provider: r.provider as AtsBoardSeed["provider"] }).id;
  const gone = new Set(diagnostics.filter(r => r.provider !== "workday" && r.status === "failed" && /^(?:404|410)\b/.test(r.message ?? ""))
    .map(id));
  const healthy = new Set(diagnostics.filter(r => r.provider !== "workday" && r.status === "ok" && r.rows > 0).map(id));
  return { ...history, boards: history.boards.filter(r => !gone.has(restore(r).id))
    .map(r => healthy.has(restore(r).id) ? { ...r, lastHealthyAt: now.toISOString() } : r) };
}
