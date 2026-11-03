// Les réponses et les lectures des tests des situations particulières
// (Q2.2.1, Q2.2.1.b) : la question posée sur l'une de leurs deux pages, ses
// options proposées, et les faits qu'elles établissent.

import { model } from "../../../core/models/eligibilite";
import type { Faits } from "../../../core/models/eligibilite/declarations/faits";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import {
  type Answers,
  pagesOf,
} from "../../../core/socle/questionnaire-engine/question/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import { preconisationOf } from "../../../core/socle/simulation/simulation";

export type Reponses = Answers<Questions>;

const pages = pagesOf(model.questionnaire);
const DES_CONTEXTES = pages.filter(({ id }) =>
  ["P2/contextes", "P2/soins"].includes(id),
);
export const posee = (id: keyof Questions, reponses: Reponses) => {
  const lues = new Questionnaire(pages).readWith(reponses);
  const question = DES_CONTEXTES.flatMap((page) => lues.questionsOn(page)).find(
    (candidate) => candidate.id === id,
  );
  return question?.kind === "multiple choice" ? question : undefined;
};
export const proposees = (id: keyof Questions, reponses: Reponses) =>
  posee(id, reponses)?.options.map(({ value }) => value);
export const faits = (reponses: Reponses) =>
  preconisationOf(model, reponses).faits as Faits;
export const valeurs = (reponses: Reponses, noms: readonly (keyof Faits)[]) =>
  noms.map((nom) => faits(reponses)[nom].value);

export const BRANCARD: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "3_AVEC_UN_PROFESSIONNEL",
  "Q1.2": ["8_BRANCARDAGE"],
  "Q1.3": ["7_AUCUNE"],
};
export const AUCUNE: Reponses = { ...BRANCARD, "Q2.2.1": ["0_AUCUNE"] };
export const CONSULTATION: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "1_SEUL",
  "Q1.3": ["7_AUCUNE"],
  "Q1.4": "1_VEHICULE_PERSONNEL",
  "Q2.1": "1_CONSULTATION",
};

export const DU_SEJOUR = [
  "fait_transfert_article80",
  "fait_centre15_interetablissements",
  "fait_permission",
  "fait_permission_charge_patient",
  "fait_permission_mineur_admissible",
] as const;
