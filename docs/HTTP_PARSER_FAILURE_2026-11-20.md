# Refresh HTTP parser crash, November 20, 2026

Status: owner-approved repair `c326f6b` is published and hosted recovery is verified. Attempt 2 of run `44879563546` succeeds with the fixed client, publishes snapshot `ddb080f`, and all four live public files match. Node 22, notification settings and quality policies are unchanged. Sustained observation continues; other employer-source warnings remain.

## Exact failure

- Gmail notice arrived November 20 at 23:20:30 Pacific: "Run failed: Sync verified jobs - main (69a80d7)." It links to [run 44879563546](https://github.com/nothenrynguyen/app-expo/actions/runs/44879563546), started at 23:17:36 Pacific. UTC timestamps name November 21; the owner-facing date is November 20 Pacific.
- Job `136771645029`: clean types and all 266 tests passed. `npm run sync:jobs` crashed at 23:20:05 with `AssertionError [ERR_ASSERTION]: false == true`, stack `Parser.finish (node:internal/deps/undici/undici:6229:9)`, TLS socket end handler. Runtime: Node 22.23.5.
- This is a process-level HTTP parser crash during collection, before coverage diagnostics or publication. There is no `.cache/refresh-blocked.json` artifact, so this was not an asserted coverage-loss rejection. The workflow step's generic "blocked refresh" wording does not identify the actual cause.
- The failed run did not publish public jobs. It persisted four observation/redirect cache files as `6721df3`. No evidence identifies the exact triggering employer URL, response status or quota exhaustion. Do not blame a particular employer, Workday 429, credits, Vercel storage or the recently edited UI.

## Upstream diagnosis

The signature matches [Undici issue 5360](https://github.com/nodejs/undici/issues/5360): response backpressure pauses the parser, then the peer closes its socket and `finish()` asserts the parser is not paused. This exception escapes ordinary request-level try/catch and terminates Node. [Upstream fix 5474](https://github.com/nodejs/undici/pull/5474) drains/resumes the parser and preserves errors for truncated bodies.

Official source checks confirm Node `v22.23.5` and `v24.22.3` both still contain `assert(!this.paused)` in `deps/undici/src/lib/dispatcher/client-h1.js`. The locally installed transitive Undici `7.30.1` contains it too. A blanket Node 24 upgrade or using the existing transitive package is therefore not a verified remediation. Official Undici `v8.12.4` source includes the paused-parser fix. Its runtime requirements and compatibility must be respected when selecting an explicit collector HTTP client/runtime combination. Changing the global dispatcher alone would not replace the affected built-in parser implementation.

## Live impact

All four production public files (`jobs`, `internships`, `fulltime`, `summary`) respond HTTP 200 and byte-match the last successful snapshot `69a80d7`, generated November 20 at 22:20:26 Pacific. Current inventory: 3,437 internships / 2,397 early-career jobs / 5,834 total, plus 630 holds. The site remains available with its prior successful data; the failed hourly attempt did not refresh it.

GitHub incident issue 3 was updated in place. Its generic "publication failed" title is less precise than these logs; the crash occurred in collection, before the publish step. Notification settings remain unchanged.

## Recommended next steps

1. Observe the following normal scheduled refresh for durability. Do not catch and ignore uncaught exceptions, weaken coverage checks, suppress emails or blindly retry every collector request.
2. Continue evidence-backed employer recovery and permitted-source expansion; the HTTP fix is operational resilience, not a solution to Workday throttling.

## Approved repair and local validation

- Pin direct dependency `undici` to `8.12.4`, whose official source contains the upstream paused-parser fix and supports Node >=22.19.0. Keep Node 22 instead of an unverified runtime-only upgrade. The existing Cheerio dependency retains its own compatible nested version; it is used for parsing, not the collector's global fetch.
- `npm run sync:jobs` preloads `scripts/collector-http.mjs` before TypeScript/collector imports capture default fetch functions. It replaces fetch and its matching Headers/Request/Response/FormData classes only in the collector process. Merely changing a dispatcher would retain the vulnerable built-in response implementation. Startup logs record exact HTTP-client and Node versions.
- No global uncaught-exception handler, source retry increase, proxy, cooldown reset, quality-gate change or notification suppression was introduced. The browser app does not load this preloader.
- Five isolated local TCP scenarios verify complete Content-Length, chunked and EOF bodies survive delayed consumption after peer close, while truncated Content-Length and chunked bodies reject. A sixth test ensures the production command loads the preloader before the collector. The old local Windows runtime did not reproduce the crash; these scenario tests plus inspected upstream code do not establish a deterministic before/after reproduction on this machine.
- `npm run verify` passes all 272 tests, clean nonincremental types, lint and static export. One live Samsung employer-board smoke test through the new preloader succeeds (78 live records, 16 student candidates). Production dependency audit: zero advisories. This smoke test is compatibility evidence, not a full hosted refresh.

## Hosted recovery evidence

- Repair [c326f6b](https://github.com/nothenrynguyen/app-expo/commit/c326f6b) was published with the approved collector-only fix. The failed-job rerun was requested through the connected GitHub tool, with no browser control or credential extraction.
- [Attempt 2](https://github.com/nothenrynguyen/app-expo/actions/runs/44879563546/attempts/2), job `136774724633`, completed successfully November 20 at 23:34:05 Pacific. Although the run metadata retains the original triggering SHA, the workflow's explicit main checkout loaded the repair: hosted startup logs state `Collector HTTP client: undici 8.12.4; v22.23.5`.
- Hosted clean types and all 272 tests pass. Collection and the unchanged coverage guard pass; publication succeeds. Snapshot [ddb080f](https://github.com/nothenrynguyen/app-expo/commit/ddb080f), generated at 23:33:49 Pacific, contains 3,438 internships / 2,402 early-career jobs / 5,840 current (+6 from the previous successful snapshot), plus 630 internal holds. Count movement is ordinary refresh activity, not claimed causal growth from the transport fix.
- All four production files respond HTTP 200 and byte-match `ddb080f`. GitHub's Vercel status confirms successful deployment. No employer request caps, cooldowns, admission checks or notification settings were changed.
- The single incident issue remains open because other sources are unavailable/incomplete; its body now correctly says the refresh completed and published healthy-source updates. This remaining warning state does not mean the rerun failed or the HTTP crash remains active.
