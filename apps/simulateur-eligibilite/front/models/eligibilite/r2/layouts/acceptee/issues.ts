// Les issues acceptées : la prescription médicale de transport et le S3141 (#135), les
// deux demandes d'accord préalable (#136). Chacune a sa fiche patient positive.

import type { Issue } from "../../../../../../core/models/eligibilite/cibles/noms";

/** Les issues de ce cas. */
export const ISSUES_ACCEPTEES = [
  "ISSUE_PMT",
  "ISSUE_S3141",
  "ISSUE_DAP_SANS_URGENCE",
  "ISSUE_DAP_URGENCE_ATTESTEE",
] as const satisfies readonly Issue[];

export type IssueAcceptee = (typeof ISSUES_ACCEPTEES)[number];

/** Cette issue est-elle acceptée ? */
export function estAcceptee(
  issue: string | null | undefined,
): issue is IssueAcceptee {
  const issues: readonly (string | null | undefined)[] = ISSUES_ACCEPTEES;
  return issues.includes(issue);
}
