// L'issue du résultat : la conclusion des règles et sa famille. C'est un objet
// valeur : égal à toute issue de même identifiant, et lu par ses méthodes.

import { describe, expect, it } from "vitest";
import {
  ACCEPTED_ISSUES,
  Issue,
  ORIENTED_ISSUES,
  REFUSED_ISSUES,
} from "../../../../core/models/eligibilite/cibles/issue.vo";
import {
  CIBLES_ENUMEREES,
  type IssueId,
} from "../../../../core/models/eligibilite/cibles/noms";
import { Cible } from "../../../../core/socle";

const familleDe = (issue: Issue) => [
  issue.isAccepted(),
  issue.isRefused(),
  issue.isOriented(),
];

describe("une issue", () => {
  it("se lit par sa famille", () => {
    expect(familleDe(Issue.accepted("ISSUE_PMT"))).toEqual([
      true,
      false,
      false,
    ]);
    expect(familleDe(Issue.refused("ISSUE_NON_ELIGIBLE"))).toEqual([
      false,
      true,
      false,
    ]);
    expect(familleDe(Issue.oriented("ISSUE_CAISSE"))).toEqual([
      false,
      false,
      true,
    ]);
  });

  it("vient de la cible des règles, avec sa famille", () => {
    const issue = Issue.of(Cible.of("ISSUE_DAP_ETRANGER_A_EXAMINER"));
    expect(issue?.equals(Issue.oriented("ISSUE_DAP_ETRANGER_A_EXAMINER"))).toBe(
      true,
    );
  });

  it("n'existe pas tant que les règles ne concluent pas", () => {
    expect(Issue.of(Cible.of<IssueId>(undefined))).toBeUndefined();
    expect(Issue.of(Cible.of<IssueId>(null))).toBeUndefined();
  });

  it("chaque issue des règles est dans une famille, et une seule", () => {
    const familles = [
      ...ACCEPTED_ISSUES,
      ...REFUSED_ISSUES,
      ...ORIENTED_ISSUES,
    ];
    expect(familles.sort()).toEqual(
      [...CIBLES_ENUMEREES.cible_issue_id].sort(),
    );
  });
});
