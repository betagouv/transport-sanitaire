// Les réponses et les lectures que partagent les tests de la permission (Q2.7
// et Q2.8).

import { decisionEngine } from "../../../../core/models/eligibilite/cibles/evaluation";
import type { Cibles } from "../../../../core/models/eligibilite/cibles/noms";
import type { Questions } from "../../../../core/models/eligibilite/questions/reponses";
import {
  Questionnaire,
  readIn,
  type Value,
} from "../../../../core/socle/questionnaire-engine";

import { QuestionnaireReadingService } from "../../../../core/socle/simulation";
import { type Lecture, R2 } from "../../../../front/models/eligibilite/r2/r2";
import { faits, pages, posee, type Reponses } from "./reponses-du-transfert";

export { faits, posee, type Reponses };

// Un patient seul, pour un autre motif, sans aucune situation en Q2.2.1.
export const SANS_SITUATION: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "1_SEUL",
  "Q1.3": ["7_AUCUNE"],
  "Q1.4": "1_VEHICULE_PERSONNEL",
  "Q2.1": "14_AUTRE",
  "Q2.2.1": ["0_AUCUNE"],
  "Q2.2.1.b": ["0_AUCUN"],
  "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
  "Q2.3.2": false,
};

// Le même, en permission pendant un séjour en établissement : seule Q2.2.1.a
// la dit (D-272). Ni le transfert ni les exceptions ne se posent.
export const PATIENT_SEUL: Reponses = {
  ...SANS_SITUATION,
  "Q2.2.1": ["1_HOSPITALISATION"],
  "Q2.2.1.cadre": "1_ETABLISSEMENT",
  "Q2.2.1.a": "1_OUI",
};

// Un mineur admissible : hospitalisé le 1er octobre, première permission le
// 14e jour, du 14 au 15, d'au plus 48 heures, autorisée, sans autre
// permission.
export const MINEUR: Reponses = {
  ...PATIENT_SEUL,
  "Q2.7": "1_MOINS_DE_SEIZE_ANS",
  "Q2.8.1": "2026-10-01",
  "Q2.8.2": "2026-10-14",
  "Q2.8.3": "2026-10-15",
  "Q2.8.duree_48h": "1_OUI",
  "Q2.8.4": "1_OUI",
  "Q2.8.5": "2_NON",
};

export const PLUSIEURS_PERMISSIONS: Reponses = {
  ...MINEUR,
  "Q2.8.5": "1_OUI",
  "Q2.8.6": "2026-12-01",
  "Q2.8.6.a": 2,
  "Q2.8.6.b": "1_OUI",
};

const PAGE_DU_MINEUR = "P2/permission-mineur";

/** Les messages d'incohérence d'une question de la page du mineur. */
export const incoherences = (id: keyof Reponses, reponses: Reponses) =>
  posee(PAGE_DU_MINEUR, id, reponses)?.inconsistencies ?? [];

/** La question est-elle validée : posée, répondue, sans blocage ? */
export const validee = (id: keyof Reponses, reponses: Reponses) =>
  new Questionnaire(pages).readWith(reponses).validated.toJSON()[id] !==
  undefined;

/** Les cibles des règles, sur les faits que les réponses établissent. */
export const ciblesDe = (reponses: Reponses) =>
  decisionEngine.cibles(faits(reponses));

/**
 * Ce que vaut cette valeur d'un résultat, sur ces réponses. `forcees` remplace
 * des cibles des règles.
 */
export const luDe = <Of>(
  value: Value<Of>,
  reponses: Reponses,
  forcees: Partial<Cibles> = {},
): Of => {
  const { validated } = new Questionnaire<Questions>(pages).readWith(reponses);
  const lus = {
    faits: faits(reponses),
    cibles: { ...ciblesDe(reponses), ...forcees },
  };
  return readIn(
    QuestionnaireReadingService.ofResult({ validated, ...lus, on: new Date() }),
  )(value);
};

/** Ce que le socle passe à R2 : ce qu'il lit. */
export const lectureDe = (
  reponses: Reponses,
  forcees: Partial<Cibles> = {},
): Lecture => ({ reading: luDe(R2.lit, reponses, forcees) });

export const issue = (reponses: Reponses) =>
  ciblesDe(reponses).cible_issue_id.value;
