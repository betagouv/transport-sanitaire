// Les réponses et les lectures que partagent les tests des lieux de P3 que
// P2 fixe ou borne (Q3.2, Q3.3).

import { model } from "../../../../core/models/eligibilite";
import type { Questions } from "../../../../core/models/eligibilite/questions/reponses";
import type { Answers } from "../../../../core/socle/questionnaire-engine/question/question";
import { Questionnaire } from "../../../../core/socle/questionnaire-engine/questionnaire";
import { ciblesValant } from "../r2/traces-du-prescripteur";

export type Reponses = Answers<Questions>;

export const ALLER: Reponses = { "Q3.1.1": 1, "Q3.1.2": "1_ALLER" };
export const RETOUR: Reponses = { "Q3.1.1": 1, "Q3.1.2": "2_RETOUR" };
export const ADRESSE = {
  street: "1 rue de la Paix",
  postalCode: "75002",
  city: "Paris",
};

/** Les questions posées sur la page, pour ces réponses. */
export function posees(pageId: string, reponses: Reponses, cibles = PMT) {
  const pages = model.complement.pages;
  const page = pages.find(({ id }) => id === pageId);
  if (!page) throw new Error(`${pageId} n'existe pas`);
  return new Questionnaire(pages).readWith(reponses, cibles).questionsOn(page);
}

/** Les identifiants des questions posées sur la page. */
export function ids(pageId: string, reponses: Reponses) {
  return posees(pageId, reponses).map(({ id }) => id);
}

/** La question posée sur la page ; elle doit l'être. */
export function posee(pageId: string, id: keyof Questions, reponses: Reponses) {
  const trouvee = posees(pageId, reponses).find((q) => q.id === id);
  if (!trouvee) throw new Error(`${id} ne se pose pas`);
  return trouvee;
}

/** Le rappel de ce que P2 établit, au-dessus de la question. */
export function rappel(
  pageId: string,
  id: keyof Questions,
  reponses: Reponses,
) {
  return posee(pageId, id, reponses).reminder;
}

/** Les natures qu'une question de nature propose. */
export function naturesDe(
  pageId: string,
  id: keyof Questions,
  reponses: Reponses,
) {
  const question = posee(pageId, id, reponses);
  return question.kind === "single choice"
    ? question.options.map(({ value }) => value)
    : [];
}

// ---- implémentation ----

const PMT = ciblesValant({ cible_support_id: "S3138g" });
