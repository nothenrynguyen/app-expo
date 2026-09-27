import type { PublicJob } from "./jobs";

type ProcessManufacturingCandidate = Pick<PublicJob, "title" | "category">;

const seniorTitle = /\b(?:senior|sr\.?|staff|principal|manager|director|head|lead)\b/i;
const specializedDegree = /\bph\.?d\.?\b|\bdoctoral\b/i;
const explicitEarlyCareer = /\b(?:intern(?:ship)?|co-?op|new grad(?:uate)?|entry[- ]level|early career|university grad(?:uate)?|college grad(?:uate)?|junior|jr\.?|engineer i)\b/i;
const excludedProcess = /\b(?:business|software|data|ai|automation|workflow|sales) process\b|\bprocess (?:analyst|manager|owner|automation)\b/i;
const excludedTechnicalTrack = /\b(?:software engineer(?:ing)?|site reliability|data infrastructure|data analy(?:st|tics)|data scien(?:ce|tist)|machine learning|ml engineer(?:ing)?|systems automation)\b/i;

const roleSignal = /\b(?:semiconductor )?process (?:engineer(?:ing)?|development|integration)\b|\bchemical engineer(?:ing)?\b|\bmaterials? (?:engineer(?:ing)?|science)\b|\bthin[ -]films?\b|\b(?:film )?deposition\b|\bphotoresist\b|\bsurface science\b|\bsemiconductor engineer(?:ing)?\b|\bfab(?:rication)?\b|\bfoundry\b|\b(?:dry |wet )?etch\b|\blithograph(?:y|ic)?\b|\bwafer\b|\bequipment (?:development )?engineer(?:ing)?\b|\bdevice characterization\b|\byield (?:engineer(?:ing)?|enhancement)\b|\bfailure analysis\b|\bdefect(?:ivity)?\b|\b(?:supplier|manufacturing|production) quality engineer(?:ing)?\b|\b(?:hardware|device|product|component|semiconductor) reliability engineer(?:ing)?\b|\bpackag(?:e|ing) engineer(?:ing)?\b|\b(?:manufacturing|industrial) engineer(?:ing)?\b/i;

export function isProcessManufacturingRole(job: ProcessManufacturingCandidate): boolean {
  const title = job.title.trim();
  const earlyCareer = explicitEarlyCareer.test(title) || /\b(?:internship|new grad)\b/i.test(job.category);

  return earlyCareer
    && !specializedDegree.test(title)
    && !seniorTitle.test(title)
    && !excludedProcess.test(title)
    && !excludedTechnicalTrack.test(title)
    && roleSignal.test(title);
}
