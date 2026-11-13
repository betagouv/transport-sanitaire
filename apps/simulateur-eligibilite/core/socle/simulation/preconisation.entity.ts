// La préconisation de réponses : leurs faits, puis leurs cibles. Seules les
// parties d'avant le verrou la font. Ses faits lisent aussi les questions
// validées : une option qui ne s'est pas proposée n'a pas été refusée.

import type { AnyFaits, CoreModel, Preconisation } from "../model.ts";
import {
  type Answers,
  type AnyCibles,
  type AnyQuestions,
  pagesOf,
  Questionnaire,
  type Reading,
} from "../questionnaire-engine/index.ts";

/** La préconisation de ces réponses, lues dans les parties d'avant le verrou. */
export function preconisationOf<
  Questions extends AnyQuestions,
  Faits extends AnyFaits,
  Cibles extends AnyCibles,
>(
  model: CoreModel<Questions, Faits, Cibles>,
  answers: Answers<Questions>,
): Preconisation<Faits, Cibles> {
  const questionnaire = new Questionnaire<Questions>(
    pagesOf(model.questionnaire),
    model.relevance,
  );
  return preconisationFrom(model, questionnaire.readWith(answers));
}

/** La préconisation d'une lecture déjà faite des parties d'avant le verrou. */
export function preconisationFrom<
  Questions extends AnyQuestions,
  Faits extends AnyFaits,
  Cibles extends AnyCibles,
>(
  model: CoreModel<Questions, Faits, Cibles>,
  read: Reading<Questions>,
): Preconisation<Faits, Cibles> {
  const faits = model.preconisation.faits(
    read.answers,
    read.validated,
    model.relevance,
  );
  return { faits, cibles: model.preconisation.cibles(faits) };
}
