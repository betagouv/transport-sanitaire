// Les boutons de R2 (#137) : pour chaque issue, le libellé de l'action qui
// complète. Un libellé `null` retire le bouton. Il ne lit que l'issue.
//
// | Issues | Compléter |
// |---|---|
// | PMT, S3141 | « Compléter la prescription » |
// | DAP_SANS_URGENCE, DAP_URGENCE_ATTESTEE | « Compléter la demande d’accord préalable » |
// | DAP_ETRANGER_A_EXAMINER | « Compléter la demande d’examen » |
// | NON_ELIGIBLE, CAISSE, ETABLISSEMENT, PERMISSION_PATIENT, CONVOCATION | non |
//
// Les libellés sont recopiés de `CONTRAT_RENDU_DOCUMENTAIRE.json` de la
// v10.1.3 (point 32). Le `completeLabel` de l'étranger dit encore « Compléter la
// demande » dans le catalogue : le contrat, plus précis, l'emporte, et l'écart
// est signalé à l'éditeur.
//
// « Précédent » et « Faire une nouvelle simulation » sont ceux du socle : ils
// ne dépendent d'aucune issue. Sans issue, les règles n'ont pas conclu : rien à compléter.

import type { Cibles } from "../../../../core/models/eligibilite/declarations/cibles";
import { given } from "../../../../core/models/eligibilite/question";

/** Le libellé de l'action qui complète, pour cette préconisation. */
export const LIBELLE_DE_COMPLETION = given
  .cible("cible_issue_id")
  .compute(({ value: issue }) => (issue && LIBELLES[issue]) ?? null);

// ---- implémentation ----

type Issue = NonNullable<Cibles["cible_issue_id"]["value"]>;

const PRESCRIPTION = "Compléter la prescription";
const ACCORD_PREALABLE = "Compléter la demande d’accord préalable";

// Les issues positives, et le document que P3 complète pour chacune.
const LIBELLES: Partial<Record<Issue, string>> = {
  ISSUE_PMT: PRESCRIPTION,
  ISSUE_S3141: PRESCRIPTION,
  ISSUE_DAP_SANS_URGENCE: ACCORD_PREALABLE,
  ISSUE_DAP_URGENCE_ATTESTEE: ACCORD_PREALABLE,
  ISSUE_DAP_ETRANGER_A_EXAMINER: "Compléter la demande d’examen",
};
