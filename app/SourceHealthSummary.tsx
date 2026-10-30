import type { JobsSummary } from "@/lib/job-summary";
import { healthDescription } from "@/lib/ingestion/source-health";

export function SourceHealthSummary({ summary }: { summary: JobsSummary }) {
  if (!summary.health) return <p>Detailed source health will appear after the next refresh.</p>;
  return <div className="source-health-summary">
    {([
      ["Discovery feeds", summary.health.feeds],
      ["Employer boards", summary.health.employers],
      ["Employer link recovery", summary.health.recovery],
    ] as const).map(([label, counts]) => <p key={label}>
      <strong>{label}: {counts.healthy}/{counts.total} healthy</strong>
      {healthDescription(counts) ? <span>. {healthDescription(counts)}.</span> : null}
    </p>)}
    <p>Discovery feeds include community lists and USAJOBS. Employer boards cover all supported hiring systems. Partial checks and cooldowns remain visible; these counts do not measure how many application links are open.</p>
  </div>;
}
