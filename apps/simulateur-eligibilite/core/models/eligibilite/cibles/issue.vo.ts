// L'issue du résultat : la conclusion des règles (`cible_issue_id`), et sa
// famille. Acceptée, elle a une fiche patient positive ; refusée,
// une fiche négative ; orientée, elle renvoie le prescripteur vers
// quelqu'un d'autre. Chaque issue des règles a sa famille, et une
// seule : une issue que l'éditeur ajoute ne compile pas sans la sienne.

import type { Cible } from "../../../socle/index.ts";
import type { IssueId } from "./noms.ts";

/** La famille de chaque issue des règles. */
const FAMILIES = {
  ISSUE_PMT: "accepted",
  ISSUE_S3141: "accepted",
  ISSUE_DAP_SANS_URGENCE: "accepted",
  ISSUE_DAP_URGENCE_ATTESTEE: "accepted",
  ISSUE_NON_ELIGIBLE: "refused",
  ISSUE_CAISSE: "oriented",
  ISSUE_ETABLISSEMENT: "oriented",
  ISSUE_PERMISSION_PATIENT: "oriented",
  ISSUE_CONVOCATION: "oriented",
  ISSUE_DAP_ETRANGER_A_EXAMINER: "oriented",
} as const satisfies Readonly<Record<IssueId, Family>>;

type Family = "accepted" | "refused" | "oriented";

type IdsOf<Of extends Family> = {
  [Id in IssueId]: (typeof FAMILIES)[Id] extends Of ? Id : never;
}[IssueId];

export type AcceptedIssueId = IdsOf<"accepted">;
export type RefusedIssueId = IdsOf<"refused">;
export type OrientedIssueId = IdsOf<"oriented">;

/** Les règles ne concluent pas encore. */
type NoIssue = undefined;

/** Les issues de chaque famille : ce qu'un cas de R2 lit sous les siennes. */
export const ACCEPTED_ISSUES = idsOf("accepted");
export const REFUSED_ISSUES = idsOf("refused");
export const ORIENTED_ISSUES = idsOf("oriented");

export class Issue<Id extends IssueId = IssueId> {
  static accepted<Id extends AcceptedIssueId>(id: Id): Issue<Id> {
    return new Issue(id, "accepted");
  }

  static refused<Id extends RefusedIssueId>(id: Id): Issue<Id> {
    return new Issue(id, "refused");
  }

  static oriented<Id extends OrientedIssueId>(id: Id): Issue<Id> {
    return new Issue(id, "oriented");
  }

  /** L'issue que donne cette cible ; aucune tant que les règles ne concluent pas. */
  static of(cible: Cible<IssueId>): Issue | NoIssue {
    const id = cible.value;
    if (id === null || id === undefined) return undefined;
    return new Issue(id, FAMILIES[id]);
  }

  readonly id: Id;
  readonly #family: Family;

  private constructor(id: Id, family: Family) {
    this.id = id;
    this.#family = family;
    Object.freeze(this);
  }

  isAccepted(): this is Issue<AcceptedIssueId> {
    return this.#family === "accepted";
  }

  isRefused(): this is Issue<RefusedIssueId> {
    return this.#family === "refused";
  }

  isOriented(): this is Issue<OrientedIssueId> {
    return this.#family === "oriented";
  }

  equals(other: Issue): boolean {
    return this.id === other.id;
  }
}

// ---- implémentation ----

function idsOf<Of extends Family>(family: Of): readonly IdsOf<Of>[] {
  const ids = Object.keys(FAMILIES) as IssueId[];
  return ids.filter((id): id is IdsOf<Of> => FAMILIES[id] === family);
}
