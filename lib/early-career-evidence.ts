// Keep section boundaries so preferred requirements and degree alternatives do
// not become mandatory experience evidence when HTML is flattened.
export function qualificationText(description: string): string {
  let text = description;
  for (let pass = 0; pass < 2; pass++) {
    text = text.replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
      .replace(/&(?:nbsp|#160);/gi, " ")
      .replace(/&(?:ndash|mdash|#8211|#8212|#x2013|#x2014);/gi, "-");
  }
  return text.replace(/<\/?(?:p|li|h[1-6]|div|ul|ol|section|br)\b[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "").replace(/[\u2013\u2014]/g, "-")
    .split(/\n/).map(line => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n");
}

export function hasRequiredExperienceConflict(description: string): boolean {
  const text = qualificationText(description);
  if (/\bthis (?:(?:role|position|job) )?(?:is not|isn't) (?:an? )?(?:entry[- ]level|early[- ]career) (?:role|position|job)\b/i.test(text)) return true;
  let required = false;
  let preferred = false;
  for (const line of text.split("\n")) {
    if (/^(?:preferred|desired|nice[- ]to[- ]have|bonus|ideally|what (?:would|will) (?:make|set) you|benefits|perks|compensation|about (?:us|the company))\b/i.test(line)) {
      required = false;
      preferred = true;
    }
    if (/^(?:(?:minimum|required|basic) (?:qualifications?|skills|experience)|requirements?|what (?:you(?:'ll| will)? need|we(?:'re| are) looking for|we require)|here(?:'s| is) what you(?:'ll| will)? need|you must have)\b/i.test(line)) {
      required = true;
      preferred = false;
    }
    if (preferred) continue;
    if (/\b(?:preferred|desired|a plus|nice[- ]to[- ]have|not required)\b/i.test(line)) continue;
    for (const match of line.matchAll(/\b(\d{1,2})\s*(?:\+|(?:-|to)\s*\d{1,2}\+?)?\s+(?:years?|yrs?)\b[^.;\n]{0,85}\bexperience\b/gi)) {
      if (Number(match[1]) < 4) continue;
      // A degree can replace these years. Do not treat that alternative as a
      // universal minimum, or infer equivalence for a particular applicant.
      if (/in lieu of (?:a |the )?(?:degree|education)|without (?:a |the )?degree|(?:degree|bachelor|master)[^\n]*\bor\b|\bor\b[^\n]*(?:degree|bachelor|master)/i.test(line)) continue;
      if (/\b(?:ph\.?d\.?|doctoral|graduate|masters?)\b[^\n]{0,65}\b(?:counts?|counted|included|qualifies)\b|\b(?:including|includes)\b[^\n]{0,65}\b(?:ph\.?d\.?|doctoral|graduate research)\b/i.test(line)) continue;
      if (required || /\b(?:minimum|at least|requires?|must have)\b/i.test(line.slice(Math.max(0, match.index! - 45), match.index))) return true;
    }
  }
  return false;
}
