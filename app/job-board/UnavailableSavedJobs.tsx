import type { SavedJobDetails } from "@/lib/saved-job-details";
import { ApplicationStatusSelect } from "./ApplicationStatusSelect";

export function UnavailableSavedJobs({ jobs, onRemove }: { jobs: readonly SavedJobDetails[]; onRemove: (id: string) => void }) {
  if (!jobs.length) return null;
  return <section className="unavailable-saved" aria-label="Saved jobs absent from the current board">
    <h2>Not on the current board ({jobs.length})</h2>
    <p>These saved listings are absent from the latest feed. They may have expired or been removed; their employer status is unverified. Your application status stays available here. Board filters do not hide this section.</p>
    {jobs.map((job) => <article className="unavailable-saved-row" key={job.id}>
      <div><strong>{job.company}</strong><p>{job.title}</p></div>
      <ApplicationStatusSelect jobId={job.id} title={`${job.title} at ${job.company}`} />
      <button type="button" className="button secondary" onClick={() => onRemove(job.id)} aria-label={`Remove saved job: ${job.title} at ${job.company}`}>Remove saved job</button>
    </article>)}
  </section>;
}
