// Le titre de R3 (#157) : un par document. Recopiés de `r3Titles` dans
// `CONTRAT_RENDU_DOCUMENTAIRE.json` de la v10.1.3, comme le texte de R3.
//
// | Issues | Titre |
// |---|---|
// | PMT, S3141 | « Prescription préremplie prête à imprimer » |
// | DAP_SANS_URGENCE, DAP_URGENCE_ATTESTEE | « Demande d’accord préalable préremplie prête à imprimer » |
// | DAP_ETRANGER_A_EXAMINER | « Demande d’examen préremplie prête à imprimer » |
//
// La DAP et l'étranger partagent le gabarit S3139h : le titre se lit sur
// l'issue, pas sur le support.

import type { Cibles } from "../../../../core/models/eligibilite/declarations/cibles";

/** Le titre de R3, selon le document que la préconisation complète. */
export function titreDuResultat(cibles: Cibles): string {
  const issue = cibles.cible_issue_id.value;
  return (issue && TITRES[issue]) ?? PRESCRIPTION;
}

/** Le texte de R3, le même pour chaque document (`r3Text`). */
export const TEXTE_DU_RESULTAT =
  "Le document est prêt à être imprimé. Il doit encore être complété et signé selon le circuit applicable avant utilisation.";

// ---- implémentation ----

type Issue = NonNullable<Cibles["cible_issue_id"]["value"]>;

const PRESCRIPTION = "Prescription préremplie prête à imprimer";
const ACCORD_PREALABLE =
  "Demande d’accord préalable préremplie prête à imprimer";

// Les issues qui ont un document. R3 ne s'ouvre pas pour les autres.
const TITRES: Partial<Record<Issue, string>> = {
  ISSUE_PMT: PRESCRIPTION,
  ISSUE_S3141: PRESCRIPTION,
  ISSUE_DAP_SANS_URGENCE: ACCORD_PREALABLE,
  ISSUE_DAP_URGENCE_ATTESTEE: ACCORD_PREALABLE,
  ISSUE_DAP_ETRANGER_A_EXAMINER: "Demande d’examen préremplie prête à imprimer",
};
