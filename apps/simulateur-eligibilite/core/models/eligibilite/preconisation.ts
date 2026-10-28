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
  type Relevance,
  type ValidatedAnswers,
} from "../../socle/index.ts";
import { type Faits, PAS_ENCORE_ETABLI } from "./declarations/faits.ts";
import type { Questions } from "./declarations/questions.ts";
import { CATALOGUE_DES_FAITS } from "./faits/index.ts";
import { P1 } from "./p1/partie-1.ts";
import { P2 } from "./p2/partie-2.ts";
import { horsCircuit } from "./p2/retour-penitentiaire.ts";

// Les parties dont la décision impose la complétude. Une question qui ne
// compte pas ne s'y pose pas : elle n'attend pas sa réponse (#255).
const P1_SEULE = new Questionnaire<Questions>(P1.pages);
const P1_ET_P2 = new Questionnaire<Questions>([...P1.pages, ...P2.pages]);

/** Les faits qu'impose la décision, que le catalogue ne calcule pas. */
export const FAITS_IMPOSES = ["fait_p1_complete", "fait_p2_complete"] as const;

/**
 * Ce que lit chaque fait. La complétude lit ses parties : leurs questions, et
 * ce que lisent leurs gardes. Hors du circuit, P2 lit Q2.2.1.indication, une
 * de ses questions.
 */
export const LECTURES_DES_FAITS = CATALOGUE_DES_FAITS.readsWith({
  fait_p1_complete: P1_SEULE.reads,
  fait_p2_complete: P1_ET_P2.reads,
});

export function faits(
  answers: GivenAnswers<Questions>,
  validated: ValidatedAnswers<Questions>,
  relevance?: Relevance,
): Faits {
  return CATALOGUE_DES_FAITS.read(validated, {
    fait_p1_complete: p1Complete(answers, relevance),
    fait_p2_complete: p2Complete(answers, validated, relevance),
  });
}

/** Les faits de ces questions validées, sauf ceux qu'impose la décision. */
export function faitsSansLaDecision(
  validated: ValidatedAnswers<Questions>,
): Faits {
  return CATALOGUE_DES_FAITS.read(validated);
}

// ---- implémentation ----

function p1Complete(
  answers: GivenAnswers<Questions>,
  relevance?: Relevance,
): Fait {
  return avec(P1_SEULE, relevance).readWith(answers).isComplete()
    ? Fait.oui("Toutes les questions de P1 ont leur réponse.")
    : Fait.non("Une question de P1 attend sa réponse.");
}

// Jamais « non » : une P2 incomplète ne dit pas que la décision est fausse.
// Hors du circuit de prescription, les règles ne concluent pas (point 34).
function p2Complete(
  answers: GivenAnswers<Questions>,
  validated: ValidatedAnswers<Questions>,
  relevance?: Relevance,
): Fait {
  const complete = avec(P1_ET_P2, relevance).readWith(answers).isComplete();
  return !horsCircuit(validated) && complete
    ? Fait.oui("Toutes les questions de P1 et de P2 ont leur réponse.")
    : Fait.inconnu(PAS_ENCORE_ETABLI);
}

// Ces parties, filtrées par la pertinence quand le modèle en a une.
function avec(
  parties: Questionnaire<Questions>,
  relevance?: Relevance,
): Questionnaire<Questions> {
  return new Questionnaire<Questions>(parties.pages, relevance);
}
