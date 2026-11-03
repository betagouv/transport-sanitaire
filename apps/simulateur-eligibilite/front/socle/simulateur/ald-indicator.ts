// L'indicateur de parcours ALD (#148) : à chaque arrivée sur le premier
// résultat, un verdict part vers Matomo, avec le nombre de questions posées.
// Le modèle dit quel parcours compte et lequel finit à la caisse ; le socle
// compte les pages et les questions.

import type { Answers } from "../../../core/socle/questionnaire-engine/question/question";
import type { Reading } from "../../../core/socle/questionnaire-engine/questionnaire";
import { Simulation } from "../../../core/socle/simulation/simulation";
import { NomEvenement, trackEvenement } from "../analytics/evenements";
import type { AldIndicator, Model } from "../model";

/**
 * Le verdict d'un parcours ALD, et ce qu'il a posé de pages et de questions
 * dans les parties comptées. `null` : ce parcours ne compte pas.
 */
export type AldPathway = {
  verdict: (typeof NomEvenement)[AldVerdict];
  pages: number;
  questions: number;
};

/** Ce que ces réponses donnent à l'indicateur, sans rien envoyer. */
export function aldPathwayOf(
  model: Model,
  answers: Answers,
): AldPathway | null {
  const indicator = model.aldIndicator;
  if (!indicator) return null;
  const simulation = Simulation.of(model.core, answers);
  const read = simulation.read(new Date());
  if (!read(indicator.counted)) return null;
  const { pages, questions } = countOf(model, indicator, simulation.reading);
  const caisse = read(indicator.caisse);
  return {
    verdict: NomEvenement[verdictOf(caisse, pages, questions, indicator.limit)],
    pages,
    questions,
  };
}

/** Envoie le verdict de ces réponses, si le parcours compte. */
export function trackAldPathway(model: Model, answers: Answers): void {
  const pathway = aldPathwayOf(model, answers);
  if (pathway) trackEvenement(pathway.verdict, pathway.questions);
}

// ---- implémentation ----

type AldVerdict =
  | "aldWithinTarget"
  | "aldTooManyPages"
  | "aldTooManyQuestions"
  | "aldCaisse";

// Les pages posées dans ces parties, et leurs questions hors sous-champs.
function countOf(
  model: Model,
  { parts, subFields = [] }: AldIndicator,
  reading: Reading,
) {
  const counted = new Set(
    model.core.questionnaire
      .filter((part) => parts.includes(part.id))
      .flatMap((part) => part.pages.map((page) => page.id)),
  );
  const pages = reading.askedPages().filter((page) => counted.has(page.id));
  const notCounted = new Set(subFields);
  const questions = pages
    .flatMap((page) => reading.questionsOn(page))
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
): AldVerdict {
  if (caisse) return "aldCaisse";
  if (pages > limit) return "aldTooManyPages";
  if (questions > limit) return "aldTooManyQuestions";
  return "aldWithinTarget";
}
