// L'urgence, sur la PMT et la DAP. L'appel au SAMU-Centre 15 ne se coche que
// s'il est établi, jamais pour une urgence seulement attestée. « Autres » se
// coche pour l'urgence attestée hors de cet appel, avec sa précision (Q3.5) :
// la condition même qui pose Q3.5, pour qu'une précision demandée s'écrive.
//
// La précision est un texte strict (T06, R04) : sur une ligne, en 8 pt, ou le
// prescripteur la raccourcit en R3. Elle s'écrit telle que saisie, retours à
// la ligne compris : un retour à la ligne ne s'imprime pas, il se corrige.
// Le gabarit de la PMT n'a pas de champ pour elle : elle s'y dessine.

import { uneUrgenceHorsCentre15 } from "../../../../../core/models/eligibilite/questions/p3/conditions/urgence-hors-centre15";
import { given } from "../../../../../core/models/eligibilite/questions/reponses";
import type { StrictOptions } from "../../../../socle";
import type { Rubrique } from "./rubrique";

/** Rien n'est saisi, ou l'urgence n'est pas « autres » : la place reste vide. */
type SansPrecision = undefined;

export type Urgence = {
  readonly urgence_appel15: boolean;
  readonly urgence_autre: boolean;
};

export type PrecisionDeLUrgence = {
  readonly urgence_precision?: string;
};

export const URGENCE: Rubrique<Urgence> = {
  urgence_appel15: given.cible("cible_urgence_appel15").isOui(),
  urgence_autre: uneUrgenceHorsCentre15,
};

export const PRECISION_DE_L_URGENCE: Rubrique<PrecisionDeLUrgence> = {
  urgence_precision: uneUrgenceHorsCentre15.computeWith(
    given.question("Q3.5").answer(),
    (attestee, { value }) => (attestee ? saisie(value) : undefined),
  ),
};

/** Le nom de la précision à l'écran (`editeur-urgence.mjs` de l'éditeur). */
export const LIBELLE_DE_LA_PRECISION = "Précision sur l’urgence";

/**
 * Comment la précision s'écrit sur le cerfa, et ce qu'en dit l'écran : les
 * mots de l'éditeur (T06, R04 ; `editeur-urgence.mjs`).
 */
export const PRECISION_STRICTE: StrictOptions = {
  size: 8,
  overflowMessage:
    "Raccourcissez la précision sur l’urgence pour pouvoir imprimer ou télécharger le document.",
  requiredMessage: "Précisez l’urgence.",
};

// ---- implémentation ----

// La saisie telle quelle : une saisie blanche n'en est pas une.
function saisie(texte: string | undefined): string | SansPrecision {
  return texte?.trim() ? texte : undefined;
}
