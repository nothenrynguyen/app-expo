"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { PublicJob, JobsSnapshot } from "@/lib/jobs";
import { safeApplicationUrl } from "@/lib/applications";
import { useSavedJobs } from "../useSavedJobs";
import { useSavedJobDetails } from "../useSavedJobDetails";
import { ApplicationStatusSelect } from "../job-board/ApplicationStatusSelect";

const EMPTY_JOBS: readonly PublicJob[] = [];
export function TrackerSavedJobs() {
  const { ids, toggle, storageError } = useSavedJobs();
  const { details, storageError: detailsError } = useSavedJobDetails(ids, EMPTY_JOBS, "internships", true);
  const [jobs, setJobs] = useState<readonly PublicJob[]>(EMPTY_JOBS);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const hasSaved = ids.size > 0;
  useEffect(() => {
    if (!hasSaved) return;
    const controller = new AbortController();
    Promise.all(["internships", "fulltime"].map(async (collection) => {
      const response = await fetch(`/${collection}.json`, { signal: controller.signal });
      if (!response.ok) throw new Error("Could not load listings");
      return (await response.json() as JobsSnapshot).jobs;
    })).then((lists) => { setJobs(lists.flat()); setLoaded(true); setFailed(false); }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [hasSaved]);
  const current = new Map(jobs.map((job) => [job.id, job]));
  const retained = new Map(details.map((job) => [job.id, job]));
  return <section className="tracker-saved" aria-label="Saved jobs">
    <h2>Saved jobs <span className="tracker-count">{ids.size}</span></h2>
    <p className="tracker-hint">Keep jobs here to apply later. Opening Apply does not mark a job as applied.</p>
    {!ids.size ? <div className="tracker-empty"><strong>No saved jobs yet</strong><p>Save a job on the <Link href="/internships">internship</Link> or <Link href="/jobs">full-time</Link> board and it will appear here.</p></div> : null}
    {failed ? <p role="status">Current listings could not load. Retained saved details are still shown. Reload to retry.</p> : hasSaved && !loaded ? <p role="status">Loading current saved listings...</p> : null}
    {[...ids].map((id) => {
      const live = current.get(id);
      const job = live ?? retained.get(id);
      const url = live ? safeApplicationUrl(live.applyUrl) : null;
      return <article className="tracker-saved-row" key={id}><div><h3>{job?.title ?? "Saved listing"}</h3><p>{job?.company ?? "Details are not available for this older save."}</p>{!live && loaded ? <small>Not in the current feed. Availability is unverified.</small> : null}</div><div className="tracker-row-actions">{url ? <a className="button primary" href={url} target="_blank" rel="noreferrer">Apply<span className="sr-only"> for {job?.title} at {job?.company}</span></a> : null}<ApplicationStatusSelect jobId={id} title={job?.title ?? "Saved listing"} /><button type="button" className="button secondary" onClick={() => toggle(id)}>Unsave<span className="sr-only"> {job?.title}</span></button></div></article>;
    })}
    {storageError || detailsError ? <p role="alert">Could not update saved jobs or retained details. Check browser storage.</p> : null}
  </section>;
}
