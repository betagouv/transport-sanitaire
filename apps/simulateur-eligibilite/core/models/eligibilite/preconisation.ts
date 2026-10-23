// Des réponses aux faits : ce que les règles de l'éditeur reçoivent.
//
// Q0.1 dit un besoin, pas un fait. Le catalogue des faits déclare chacun dans
// son fichier (`faits/`). La décision y impose la complétude :
// P1 et P2 sont complètes quand toutes leurs questions posées ont leur réponse
// (D-110). Un retour pénitentiaire hors du circuit de prescription ne complète
// pas P2.

import {
  Fait,
  type GivenAnswers,
  Questionnaire,
  type ValidatedAnswers,
} from "../../socle/index.ts";
import { type Faits, PAS_ENCORE_ETABLI } from "./declarations/faits.ts";
import type { Questions } from "./declarations/questions.ts";
import { CATALOGUE_DES_FAITS } from "./faits/index.ts";
import { P1 } from "./p1/partie-1.ts";
import { P2 } from "./p2/partie-2.ts";
import { horsCircuit } from "./p2/retour-penitentiaire.ts";

export function faits(
  answers: GivenAnswers<Questions>,
  validated: ValidatedAnswers<Questions>,
): Faits {
  return CATALOGUE_DES_FAITS.read(answers, validated, {
    fait_p1_complete: p1Complete(answers),
    fait_p2_complete: p2Complete(answers, validated),
  });
}

// ---- implémentation ----

function p1Complete(answers: GivenAnswers<Questions>): Fait {
  return new Questionnaire(P1.pages).readWith(answers).isComplete()
    ? Fait.oui("Toutes les questions de P1 ont leur réponse.")
    : Fait.non("Une question de P1 attend sa réponse.");
}

// Jamais « non » : une P2 incomplète ne dit pas que la décision est fausse.
// Hors du circuit de prescription, les règles ne concluent pas (point 34).
function p2Complete(
  answers: GivenAnswers<Questions>,
  validated: ValidatedAnswers<Questions>,
): Fait {
  const complete = new Questionnaire([...P1.pages, ...P2.pages])
    .readWith(answers)
    .isComplete();
  return !horsCircuit(validated) && complete
    ? Fait.oui("Toutes les questions de P1 et de P2 ont leur réponse.")
    : Fait.inconnu(PAS_ENCORE_ETABLI);
}
