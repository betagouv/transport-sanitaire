// Le texte que R2 donne à chaque issue (#133 à #136) : la fiche négative, la
// fiche positive, ou la page du prescripteur. R2 choisit son texte ici
// (`resultat.tsx`), et ce que lit un texte ne compte que pour ses issues
// (`trace-du-resultat.ts`, #255).

import type { Cibles } from "../../../../core/models/eligibilite/declarations/cibles";

/** Une issue des règles. */
export type Issue = NonNullable<Cibles["cible_issue_id"]["value"]>;

/** Les trois textes de R2. */
export type TexteDeR2 = "fiche négative" | "fiche positive" | "prescripteur";

/** Le texte de chaque issue. */
const TEXTE_DE_L_ISSUE = {
  ISSUE_NON_ELIGIBLE: "fiche négative",
  ISSUE_PMT: "fiche positive",
  ISSUE_S3141: "fiche positive",
  ISSUE_DAP_SANS_URGENCE: "fiche positive",
  ISSUE_DAP_URGENCE_ATTESTEE: "fiche positive",
  ISSUE_CAISSE: "prescripteur",
  ISSUE_ETABLISSEMENT: "prescripteur",
  ISSUE_PERMISSION_PATIENT: "prescripteur",
  ISSUE_CONVOCATION: "prescripteur",
  ISSUE_DAP_ETRANGER_A_EXAMINER: "prescripteur",
} as const satisfies Record<Issue, TexteDeR2>;

/** Les issues qui ont ce texte. */
export type IssueDuTexte<Texte extends TexteDeR2> = {
  [I in Issue]: (typeof TEXTE_DE_L_ISSUE)[I] extends Texte ? I : never;
}[Issue];

/** Cette issue a-t-elle ce texte ? */
export function aLeTexte<Texte extends TexteDeR2>(
  issue: Issue,
  texte: Texte,
): issue is IssueDuTexte<Texte> {
  return TEXTE_DE_L_ISSUE[issue] === texte;
}

/** Les issues qui ont ce texte. */
export function issuesDuTexte<Texte extends TexteDeR2>(
  texte: Texte,
): readonly IssueDuTexte<Texte>[] {
  const issues = Object.keys(TEXTE_DE_L_ISSUE) as Issue[];
  return issues.filter((issue) => aLeTexte(issue, texte));
}
