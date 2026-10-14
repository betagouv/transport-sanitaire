// Des réponses aux faits : ce que les règles de l'éditeur reçoivent.
//
// Q0.1 dit un besoin, pas un fait. Seule P1 établit des faits aujourd'hui : P2
// n'est pas encore posée, et ses faits restent absents.

import type { Answers } from "../../socle";
import { areAnswered, type Validated } from "../../socle";
import { AUCUN_FAIT, type Faits } from "./declarations/faits";
import type { Questions } from "./declarations/questions";
import { faitsDuMode } from "./mode-de-transport";
import { P1 } from "./questionnaire";

export function faits(
  answers: Answers<Questions>,
  validated: Validated<Questions>,
): Faits {
  const complete = areAnswered(P1.pages, answers);
  return {
    ...AUCUN_FAIT,
    ...faitsDuMode(validated),
    fait_p1_complete: complete
      ? {
          value: true,
          provenance: "Toutes les questions de P1 ont leur réponse.",
        }
      : { value: false, provenance: "Une question de P1 attend sa réponse." },
  };
}
