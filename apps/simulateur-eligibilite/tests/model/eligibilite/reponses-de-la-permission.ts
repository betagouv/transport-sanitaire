// Les réponses et les lectures que partagent les tests de la permission (Q2.7
// et Q2.8).

import type { Cibles } from "../../../core/models/eligibilite/declarations/cibles";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import { cibles } from "../../../core/models/eligibilite/evaluation-des-regles";
import {
  readIn,
  type Value,
} from "../../../core/socle/questionnaire-engine/condition";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import { resultReading } from "../../../core/socle/questionnaire-engine/result-reading";
import {
  type Lecture,
  LU_PAR_R2,
} from "../../../front/models/eligibilite/r2/trace-du-resultat";
import { faits, pages, posee, type Reponses } from "./reponses-du-transfert";

export { faits, posee, type Reponses };

// Un patient seul, dont le motif est une permission : le séjour ne s'y propose
// pas, et ni le transfert ni les exceptions ne se posent.
export const PATIENT_SEUL: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "1_SEUL",
  "Q1.3": ["7_AUCUNE"],
  "Q1.4": "1_VEHICULE_PERSONNEL",
  "Q2.1": "11_PERMISSION",
  "Q2.2.1": ["4_AUCUNE"],
  "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
  "Q2.3.2": false,
};

// Un mineur admissible : hospitalisé le 1er octobre, première permission le
// 14e jour, de 24 heures, autorisée, sans autre permission.
export const MINEUR: Reponses = {
  ...PATIENT_SEUL,
  "Q2.7": "1_MOINS_DE_SEIZE_ANS",
  "Q2.8.1": "2026-10-01",
  "Q2.8.2": "2026-10-14T09:00",
  "Q2.8.3": "2026-10-15T09:00",
  "Q2.8.4": "1_OUI",
  "Q2.8.4.a": "1_SOINS",
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
export const ciblesDe = (reponses: Reponses) => cibles(faits(reponses));

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
  return readIn(resultReading({ validated, ...lus, on: new Date() }))(value);
};

/** Ce que le socle passe à R2 : ce qu'il lit. */
export const lectureDe = (
  reponses: Reponses,
  forcees: Partial<Cibles> = {},
): Lecture => ({ reading: luDe(LU_PAR_R2, reponses, forcees) });

export const issue = (reponses: Reponses) =>
  ciblesDe(reponses).cible_issue_id.value;
