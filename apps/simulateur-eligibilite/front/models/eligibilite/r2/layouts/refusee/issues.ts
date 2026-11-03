// Les issues refusées : la non-éligibilité (#134), qui a sa fiche patient négative.

import type { Issue } from "../../../../../../core/models/eligibilite/cibles/noms";

/** Les issues de ce cas. */
export const ISSUES_REFUSEES = [
  "ISSUE_NON_ELIGIBLE",
] as const satisfies readonly Issue[];

export type IssueRefusee = (typeof ISSUES_REFUSEES)[number];

/** Cette issue est-elle refusée ? */
export function estRefusee(
  issue: string | null | undefined,
): issue is IssueRefusee {
  const issues: readonly (string | null | undefined)[] = ISSUES_REFUSEES;
  return issues.includes(issue);
}
