// Les constructeurs des questions du modèle : `question.singleChoice("Q1.1",
// { label })`. Les options viennent du catalogue de l'éditeur, et les gardes
// lisent les faits des questions validées avant elles.
//
// Ces faits sont ceux des réponses, sans la complétude de P1 et de P2 : la
// constater pose les questions, donc lit leurs gardes.

import {
  type QuestionContext,
  questionsOf,
  type ValidatedAnswers,
} from "../../socle";
import type { Faits } from "./declarations/faits";
import { OPTIONS, type Questions } from "./declarations/questions";
import { faitsDeLaBranche } from "./p2/branche";
import { faitsAvantLaBranche } from "./p2/faits-avant-la-branche";

/** Les faits que les réponses établissent, hors complétude des parties. */
export type FaitsDesReponses = Omit<
  Faits,
  "fait_p1_complete" | "fait_p2_complete"
>;

/** Ce que lit une condition déclarée hors de son constructeur. */
export type Context = QuestionContext<Questions, undefined, FaitsDesReponses>;

/** Les faits des réponses validées, dans l'ordre où ils s'écrasent. */
export function faitsDesReponses(
  validated: ValidatedAnswers<Questions>,
): FaitsDesReponses {
  return {
    ...faitsAvantLaBranche(validated),
    // Après les contextes : la branche l'emporte sur le « À qualifier » de Q2.2.1.b.
    ...faitsDeLaBranche(validated),
  };
}

/** Les constructeurs des questions de P0 à P2. */
export const question = questionsOf<Questions, FaitsDesReponses>({
  options: OPTIONS,
  faits: (_answers, validated) => faitsDesReponses(validated),
});
