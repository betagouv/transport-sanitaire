// Les boutons de R2 (#137) : pour chaque issue, le libellé de l'action qui
// complète. Un libellé `null` retire le bouton. Une fonction pure, sans React.
//
// | Issues | Compléter |
// |---|---|
// | PMT, deux DAP, S3141 | « Compléter la prescription » |
// | NON_ELIGIBLE, CAISSE, ETABLISSEMENT, PERMISSION_PATIENT, CONVOCATION | non |
// | DAP_ETRANGER_A_EXAMINER | « Compléter la demande » |
//
// « Précédent » et « Faire une nouvelle simulation » sont ceux du socle : ils ne dépendent
// d'aucune issue. Sans issue, les règles n'ont pas conclu : rien à compléter.

import type { Cibles } from "./declarations/cibles";

/** Le libellé de l'action qui complète, pour cette préconisation. */
export function libelleDeCompletion(cibles: Cibles): string | null {
  const issue = cibles.cible_issue_id;
  if (!issue) return null;
  if (issue === "ISSUE_DAP_ETRANGER_A_EXAMINER") return COMPLETER_LA_DEMANDE;
  return ISSUES_A_PRESCRIPTION.includes(issue)
    ? "Compléter la prescription"
    : null;
}

// ---- implémentation ----

type Issue = NonNullable<Cibles["cible_issue_id"]>;

// Les issues positives dont P3 complète la prescription.
const ISSUES_A_PRESCRIPTION: readonly Issue[] = [
  "ISSUE_PMT",
  "ISSUE_DAP_SANS_URGENCE",
  "ISSUE_DAP_URGENCE_ATTESTEE",
  "ISSUE_S3141",
];

// Recopié mot pour mot de `completeLabel` de ISSUE_DAP_ETRANGER_A_EXAMINER
// (`rules/catalogue-resultats.json`, `integration_resultats/etranger-contenu.json`
// chez l'éditeur). Le catalogue pèse 900 ko et ne se charge qu'à l'affichage de
// R2 : le libellé d'un bouton ne le fait pas entrer dans le chunk d'entrée. Un
// test le compare au catalogue.
const COMPLETER_LA_DEMANDE = "Compléter la demande";
