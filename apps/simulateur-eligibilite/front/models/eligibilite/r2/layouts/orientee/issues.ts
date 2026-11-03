// Les issues orientées : les cinq issues sans fiche patient (#133). Le prescripteur est
// renvoyé ailleurs : leur page est la sienne.

import type { Issue } from "../../../../../../core/models/eligibilite/cibles/noms";

/** Les issues de ce cas. */
export const ISSUES_ORIENTEES = [
  "ISSUE_CAISSE",
  "ISSUE_ETABLISSEMENT",
  "ISSUE_PERMISSION_PATIENT",
  "ISSUE_CONVOCATION",
  "ISSUE_DAP_ETRANGER_A_EXAMINER",
] as const satisfies readonly Issue[];

export type IssueOrientee = (typeof ISSUES_ORIENTEES)[number];

/** Cette issue est-elle orientée ? */
export function estOrientee(
  issue: string | null | undefined,
): issue is IssueOrientee {
  const issues: readonly (string | null | undefined)[] = ISSUES_ORIENTEES;
  return issues.includes(issue);
}
