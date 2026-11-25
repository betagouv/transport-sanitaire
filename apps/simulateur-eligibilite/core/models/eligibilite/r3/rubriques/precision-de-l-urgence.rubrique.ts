// La précision de l'urgence « autres » sur la PMT et la DAP (Q3.5). Elle ne
// s'écrit que si l'urgence attestée hors Centre 15 est retenue
// (`urgence.rubrique.ts`).
//
// La précision est un texte strict (T06, R04) : elle s'écrit telle que saisie,
// retours à la ligne compris : un retour à la ligne ne s'imprime pas, il se
// corrige. Comment elle se dessine est l'affaire de l'écran.

import { uneUrgenceHorsCentre15 } from "../../questions/p3/conditions/urgence-hors-centre15.condition.ts";
import { given } from "../../questions/reponses.ts";
import type { Rubrique } from "./rubrique.types.ts";

/** Rien n'est saisi, ou l'urgence n'est pas « autres » : la place reste vide. */
type SansPrecision = undefined;

export type PrecisionDeLUrgence = {
  readonly urgence_precision?: string;
};

export const PRECISION_DE_L_URGENCE: Rubrique<PrecisionDeLUrgence> = {
  urgence_precision: uneUrgenceHorsCentre15.computeWith(
    given.question("Q3.5").answer(),
    (attestee, { value }) => (attestee ? saisie(value) : undefined),
  ),
};

// ---- implémentation ----

// La saisie telle quelle : une saisie blanche n'en est pas une.
function saisie(texte: string | undefined): string | SansPrecision {
  return texte?.trim() ? texte : undefined;
}
