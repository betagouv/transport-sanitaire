// Des réponses aux faits : ce que les règles de l'éditeur reçoivent.
//
// Q0.1 dit un besoin, pas un fait. P1 établit ses faits, et P2 ceux de la
// prestation, des situations particulières, du trajet, du transfert, des
// exceptions de l'article 80, de la permission, de la convocation et de sa
// branche. L'exclusion du transport se constate sans question. P1 et P2 sont
// complètes quand toutes leurs questions posées ont leur réponse (D-110). Un
// retour pénitentiaire hors du circuit de prescription ne complète pas P2.

import {
  areAnswered,
  Fait,
  type GivenAnswers,
  type ValidatedAnswers,
} from "../../../core/socle";
import { AUCUN_FAIT, type Faits } from "./declarations/faits";
import type { Questions } from "./declarations/questions";
import { P1 } from "./p1/partie-1";
import { P2 } from "./p2/partie-2";
import { horsCircuit } from "./p2/retour-penitentiaire";
import { faitsDesReponses } from "./question";

export function faits(
  answers: GivenAnswers<Questions>,
  validated: ValidatedAnswers<Questions>,
): Faits {
  const complete = areAnswered(P1.pages, answers);
  return {
    ...faitsDesReponses(validated),
    fait_p1_complete: complete
      ? Fait.oui("Toutes les questions de P1 ont leur réponse.")
      : Fait.non("Une question de P1 attend sa réponse."),
    // Jamais « non » : une P2 incomplète ne dit pas que la décision est fausse.
    // Hors du circuit de prescription, les règles ne concluent pas (point 34).
    fait_p2_complete:
      !horsCircuit(validated) &&
      areAnswered([...P1.pages, ...P2.pages], answers)
        ? Fait.oui("Toutes les questions de P1 et de P2 ont leur réponse.")
        : AUCUN_FAIT.fait_p2_complete,
  };
}
