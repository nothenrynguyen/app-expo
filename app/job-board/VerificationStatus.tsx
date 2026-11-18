import type { PublicJob } from "@/lib/jobs";

const verifiedTime = new Intl.DateTimeFormat("en-US", {
  month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC",
});

export function VerificationStatus({ job }: { job: PublicJob }) {
  if (job.verification?.status !== "awaiting") return null;
  const date = job.verification.lastVerifiedAt;
  return <span className="verification-status">
    <span className="verification-badge">Couldn&apos;t recheck availability</span>
    <small>{date && Number.isFinite(Date.parse(date))
      ? <>Last verified <time dateTime={date}>{verifiedTime.format(new Date(date))} UTC</time></>
      : "Last verification time unavailable"}</small>
  </span>;
}
