const marker = "<!-- empluzzed-refresh-incident -->";

// Edit one issue, without posting a new notification comment on every retry.
// A skipped refresh must never resolve an incident using an old report.
export async function updateRefreshIncident({ github, context, conclusion, report, changes }) {
  if (conclusion === "skipped") return { action: "skipped" };
  const failed = conclusion !== "success";
  if (!failed && (!report?.completedAt || !changes?.availability)) throw new Error("Missing current refresh diagnostics");
  const held = changes?.availability?.awaitingVerification ?? 0;
  const degraded = failed || held > 0 || report.status !== "healthy";
  const { owner, repo } = context.repo;
  const issues = await github.paginate(github.rest.issues.listForRepo, { owner, repo, state: "open", creator: "github-actions[bot]", per_page: 100 });
  const existing = issues.find(issue => !issue.pull_request && issue.body?.includes(marker));
  if (!degraded) {
    if (existing) await github.rest.issues.update({ owner, repo, issue_number: existing.number,
      state: "closed", state_reason: "completed", body: `${marker}\nRefresh recovered. The latest refresh published successfully with no source warnings or held jobs.\n\n[Verified run](${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId})` });
    return { action: existing ? "closed" : "healthy" };
  }
  const title = failed ? "Refresh incident: publication failed" : "Refresh incident: source availability warnings";
  const body = `${marker}\n${failed ? "The refresh failed. Check the linked run for the failing step. Publication is not confirmed." : "The refresh completed and published healthy-source updates. Some sources remain unavailable or incomplete; these warnings do not fail the workflow."}\n\n${failed ? "" : `Current listings: ${changes.availability.current}. Previously listed jobs held internally: ${held}.\n\n`}This single issue is updated during the incident and closes after a fully healthy refresh. Repeated retries do not create comments or new issues. Genuine code, safety-check and publication failures still fail the workflow.\n\n[Latest run](${context.serverUrl}/${owner}/${repo}/actions/runs/${context.runId})`;
  if (existing) await github.rest.issues.update({ owner, repo, issue_number: existing.number, title, body });
  else await github.rest.issues.create({ owner, repo, title, body });
  return { action: existing ? "updated" : "created" };
}
