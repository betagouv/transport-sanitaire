// Le second résultat (R3) : ce que dit le document que la préconisation
// complète. Son choix, son titre, le libellé du bouton qui y mène depuis R2, et
// son texte. Le rendu (le texte à l'écran, et où chaque entrée s'écrit dans le
// PDF) est dans `front/models/eligibilite/r3/`.
//
// Le document, d'après `cible_support_id` :
//
// | Support | Document | Issues |
// |---|---|---|
// | S3138g | prescription médicale de transport (Cerfa 11574*07) | PMT |
// | S3139h | demande d'accord préalable (Cerfa 11575*08) | les deux DAP, l'étranger |
// | S3141 | prescription de permission de sortie, moins de 20 ans | S3141 |
// | AUCUN | aucun document : R2 est le dernier écran | les autres |
//
// Les gabarits sont ceux de `formulaires/` de la v10.1.3, à l'octet près
// (`PROVENANCE_FORMULAIRES.json`). Les trois se remplissent : le S3141
// (`s3141.ts`), la PMT (`s3138g.ts`) et la DAP (`s3139h.ts`).
//
// Le titre et le bouton, d'après l'issue, recopiés de
// `CONTRAT_RENDU_DOCUMENTAIRE.json` (v10.1.4, point 32) :
//
// | Issues | Titre | Compléter |
// |---|---|---|
// | PMT, S3141 | « Prescription préremplie prête à imprimer » | « Compléter la prescription » |
// | DAP_SANS_URGENCE, DAP_URGENCE_ATTESTEE | « Demande d’accord préalable préremplie prête à imprimer » | « Compléter la demande d’accord préalable » |
// | DAP_ETRANGER_A_EXAMINER | « Demande d’examen préremplie prête à imprimer » | « Compléter la demande d’examen » |
// | NON_ELIGIBLE, CAISSE, ETABLISSEMENT, PERMISSION_PATIENT, CONVOCATION | | sans bouton |
//
// La DAP et l'étranger partagent le gabarit S3139h : le titre se lit sur
// l'issue, pas sur le support. Sans issue, les règles n'ont pas conclu : rien
// à compléter. « Précédent » et « Faire une nouvelle simulation » sont ceux
// du socle : ils ne dépendent d'aucune issue.

import {
  type CerfaDto,
  CerfaDtoService,
  type CerfaMapping,
} from "../../../socle/index.ts";
import type { Cibles, IssueId } from "../cibles/noms.ts";
import { given } from "../questions/reponses.ts";
import { VERS_LA_PMT } from "./s3138g.ts";
import { VERS_LA_DAP } from "./s3139h.ts";
import { VERS_LE_S3141 } from "./s3141.ts";

/** Les supports qui ont un document à compléter. */
export type Support = Exclude<
  NonNullable<Cibles["cible_support_id"]["value"]>,
  "AUCUN"
>;

const SUPPORT = given.cible("cible_support_id");
const ISSUE = given.cible("cible_issue_id");

const DOCUMENTS = given.all({
  S3138g: lecture("S3138g", VERS_LA_PMT),
  S3139h: lecture("S3139h", VERS_LA_DAP),
  S3141: lecture("S3141", VERS_LE_S3141),
} satisfies Record<Support, unknown>);

const PRESCRIPTION = "Prescription préremplie prête à imprimer";
const ACCORD_PREALABLE =
  "Demande d’accord préalable préremplie prête à imprimer";

// Les issues qui ont un document. R3 ne s'ouvre pas pour les autres.
const TITRES: Partial<Record<IssueId, string>> = {
  ISSUE_PMT: PRESCRIPTION,
  ISSUE_S3141: PRESCRIPTION,
  ISSUE_DAP_SANS_URGENCE: ACCORD_PREALABLE,
  ISSUE_DAP_URGENCE_ATTESTEE: ACCORD_PREALABLE,
  ISSUE_DAP_ETRANGER_A_EXAMINER: "Demande d’examen préremplie prête à imprimer",
};

const COMPLETER_LA_PRESCRIPTION = "Compléter la prescription";
const COMPLETER_L_ACCORD = "Compléter la demande d’accord préalable";

// Les issues positives, et le document que P3 complète pour chacune.
const BOUTONS: Partial<Record<IssueId, string>> = {
  ISSUE_PMT: COMPLETER_LA_PRESCRIPTION,
  ISSUE_S3141: COMPLETER_LA_PRESCRIPTION,
  ISSUE_DAP_SANS_URGENCE: COMPLETER_L_ACCORD,
  ISSUE_DAP_URGENCE_ATTESTEE: COMPLETER_L_ACCORD,
  ISSUE_DAP_ETRANGER_A_EXAMINER: "Compléter la demande d’examen",
};

export const R3 = {
  /** Le texte de R3 ne lit rien des réponses : le document les porte. */
  lit: given.all({}),
  /** Le support du document que cette préconisation complète. `null` : aucun. */
  document: SUPPORT.computeWith(DOCUMENTS, ({ value: support }, documents) =>
    support == null || support === "AUCUN" ? null : documents[support],
  ),
  /**
   * La précision de l'urgence s'écrit telle que saisie : Q3.5 a un compteur,
   * mesuré sur le document (T06, R04).
   */
  mesurees: { "Q3.5": "urgence_precision" },
  /** Le titre de R3, selon le document que la préconisation complète. */
  titre: ISSUE.compute(
    ({ value: issue }) => (issue && TITRES[issue]) ?? PRESCRIPTION,
  ),
  /** Le libellé de l'action qui complète. `null` retire le bouton. */
  boutonDeDepart: ISSUE.compute(
    ({ value: issue }) => (issue && BOUTONS[issue]) ?? null,
  ),
  /** Le texte de R3, le même pour chaque document (`r3Text`). */
  texte:
    "Le document est prêt à être imprimé. Complétez les données manquantes, faites-le signer puis remettez-le au patient.",
};

// ---- implémentation ----

// Le support, quand il est choisi, en lecture de ce que lit son cerfa : ce que
// lisent les cases d'un cerfa ne compte que pour son support.
function lecture(support: Support, mapping: CerfaMapping<CerfaDto>) {
  return SUPPORT.branch([support], CerfaDtoService.readingOf(mapping, support));
}
