// Le second résultat (R3) : le document que la préconisation complète, son
// titre, le bouton qui y mène depuis R2, et son texte. Le socle pose les
// boutons d'impression et de téléchargement, puis l'aperçu du document.
//
// Le document, d'après `cible_support_id` (#157) :
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
// (`s3141/`, #158), la PMT (`s3138g/`, #160) et la DAP (`s3139h/`, #161).
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

import type {
  Cibles,
  Issue,
} from "../../../../core/models/eligibilite/cibles/noms";
import { given } from "../../../../core/models/eligibilite/questions/question";
import { cerfaValue } from "../../../socle";
import { S3138G } from "./s3138g/s3138g";
import { S3139H } from "./s3139h/s3139h";
import { S3141 } from "./s3141/s3141";

type Support = Exclude<
  NonNullable<Cibles["cible_support_id"]["value"]>,
  "AUCUN"
>;

const SUPPORT = given.cible("cible_support_id");
const ISSUE = given.cible("cible_issue_id");

// Les documents du modèle, par support. Ce que lisent les cases d'un cerfa ne
// compte que pour son support (#255).
const DOCUMENTS = given.all({
  S3138g: SUPPORT.branch(["S3138g"], cerfaValue(S3138G)),
  S3139h: SUPPORT.branch(["S3139h"], cerfaValue(S3139H)),
  S3141: SUPPORT.branch(["S3141"], cerfaValue(S3141)),
} satisfies Record<Support, unknown>);

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

const COMPLETER_LA_PRESCRIPTION = "Compléter la prescription";
const COMPLETER_L_ACCORD = "Compléter la demande d’accord préalable";

// Les issues positives, et le document que P3 complète pour chacune.
const BOUTONS: Partial<Record<Issue, string>> = {
  ISSUE_PMT: COMPLETER_LA_PRESCRIPTION,
  ISSUE_S3141: COMPLETER_LA_PRESCRIPTION,
  ISSUE_DAP_SANS_URGENCE: COMPLETER_L_ACCORD,
  ISSUE_DAP_URGENCE_ATTESTEE: COMPLETER_L_ACCORD,
  ISSUE_DAP_ETRANGER_A_EXAMINER: "Compléter la demande d’examen",
};

// Le texte de R3, le même pour chaque document (`r3Text`).
const TEXTE =
  "Le document est prêt à être imprimé. Complétez les données manquantes, faites-le signer puis remettez-le au patient.";

export const R3 = {
  /** Le texte de R3 ne lit rien des réponses : le document les porte. */
  lit: given.all({}),
  /** Le document que cette préconisation complète. `null` : aucun. */
  document: SUPPORT.computeWith(DOCUMENTS, ({ value: support }, documents) =>
    support == null || support === "AUCUN" ? null : documents[support],
  ),
  /** Le titre de R3, selon le document que la préconisation complète. */
  titre: ISSUE.compute(
    ({ value: issue }) => (issue && TITRES[issue]) ?? PRESCRIPTION,
  ),
  /** Le libellé de l'action qui complète. `null` retire le bouton. */
  boutonDeDepart: ISSUE.compute(
    ({ value: issue }) => (issue && BOUTONS[issue]) ?? null,
  ),
  /** Le texte du contrat, sous le stepper. */
  Page: () => <p>{TEXTE}</p>,
};
