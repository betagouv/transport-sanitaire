// L'indicateur de parcours ALD (#148) : le verdict d'une simulation sur son
// premier résultat, avec le nombre de questions posées. Le modèle dit quel
// parcours compte et lequel finit à la caisse ; le socle compte les pages et
// les questions. La mesure d'audience l'envoie (`useAldResultReached`).

import type { Simulation } from "../../../core/socle/simulation";
import { type AldVerdict, EventName } from "../analytics";
import type { AldIndicator, Model } from "../model";

/**
 * Le verdict d'un parcours ALD, et ce qu'il a posé de pages et de questions
 * dans les parties comptées. `null` : ce parcours ne compte pas.
 */
export type AldPathway = {
  verdict: AldVerdict;
  pages: number;
  questions: number;
};

/** Ce que cette simulation, sur son premier résultat, donne à l'indicateur, sans rien envoyer. */
export function aldPathwayOf(
  model: Model,
  simulation: Simulation,
): AldPathway | null {
  const indicator = model.aldIndicator;
  if (!indicator) return null;
  const read = simulation.read(new Date());
  if (!read(indicator.counted)) return null;
  const { pages, questions } = countOf(model, indicator, simulation);
  const caisse = read(indicator.caisse);
  return {
    verdict: EventName[verdictOf(caisse, pages, questions, indicator.limit)],
    pages,
    questions,
  };
}

// ---- implémentation ----

type VerdictName =
  | "aldWithinTarget"
  | "aldTooManyPages"
  | "aldTooManyQuestions"
  | "aldCaisse";

// Les pages posées dans ces parties, et leurs questions hors sous-champs.
function countOf(
  model: Model,
  { parts, subFields = [] }: AldIndicator,
  simulation: Simulation,
) {
  const counted = new Set(
    model.core.questionnaire
      .filter((part) => parts.includes(part.id))
      .flatMap((part) => part.pages.map((page) => page.id)),
  );
  const pages = simulation.pages().filter((page) => counted.has(page.id));
  const notCounted = new Set(subFields);
  const questions = pages
    .flatMap((page) => simulation.questionsOn(page))
    .filter((question) => !notCounted.has(question.id)).length;
  return { pages: pages.length, questions };
}

// Une page pose au moins une question : trop de pages, c'est aussi trop de
// questions. Le verdict garde le dépassement le plus large.
function verdictOf(
  caisse: boolean,
  pages: number,
  questions: number,
  limit: number,
): VerdictName {
  if (caisse) return "aldCaisse";
  if (pages > limit) return "aldTooManyPages";
  if (questions > limit) return "aldTooManyQuestions";
  return "aldWithinTarget";
}
