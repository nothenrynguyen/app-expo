import { recordWorkdayAttempt, workdayCooldown, type WorkdaySchedule } from "./workday-schedule";

export function createWorkdayRequestGate(state: WorkdaySchedule, fetcher: typeof fetch = fetch,
  now = () => new Date(), spacingMs = 150) {
  const queues = new Map<string, Promise<unknown>>();
  const next = new Map<string, number>();
  const canRequest = (url: string) => {
    const host = new URL(url).hostname;
    return !host.endsWith(".myworkdayjobs.com") || !workdayCooldown(state, host, now());
  };
  const guardedFetch: typeof fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const host = new URL(url).hostname;
    if (!host.endsWith(".myworkdayjobs.com")) return fetcher(input, init);
    // Serialize complete requests per host so a denial pauses queued calls too.
    const turn = (queues.get(host) ?? Promise.resolve()).then(async () => {
      if (!canRequest(url)) throw new Error("Workday host is in cooldown");
      const delay = Math.max(0, (next.get(host) ?? 0) - Date.now());
      if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      if (!canRequest(url)) throw new Error("Workday host is in cooldown");
      next.set(host, Date.now() + spacingMs);
      const response = await fetcher(input, init);
      if ([401, 403, 429].includes(response.status)) {
        const retry = response.headers.get("retry-after");
        const retryMs = retry ? (/^\d+$/.test(retry) ? Number(retry) * 1000 : Date.parse(retry) - now().getTime()) : 0;
        recordWorkdayAttempt(state, host, response.status === 429 ? "rate_limited" : "unavailable",
          now(), `${response.status} Workday access paused`, Number.isFinite(retryMs) ? retryMs : 0);
      }
      return response;
    });
    queues.set(host, turn.catch(() => {}));
    return turn;
  };
  return { canRequest, fetch: guardedFetch };
}
