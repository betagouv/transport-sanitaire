// L'urgence, sur la PMT et la DAP. L'appel au SAMU-Centre 15 ne se coche que
// s'il est établi, jamais pour une urgence seulement attestée. « Autres » se
// coche pour l'urgence attestée hors de cet appel, avec sa précision (Q3.5) :
// la condition même qui pose Q3.5, pour qu'une précision demandée s'écrive
// (#464).
//
// Le gabarit n'a pas de champ pour la précision : elle se dessine (D-93).

import { uneUrgenceHorsCentre15 } from "../../../../../core/models/eligibilite/questions/p3/conditions/urgence-hors-centre15";
import { given } from "../../../../../core/models/eligibilite/questions/reponses";
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

// ---- implémentation ----

// La saisie telle quelle, ses espaces normalisés.
function saisie(texte: string | undefined): string | SansPrecision {
  const normale = texte?.replace(/\s+/g, " ").trim();
  return normale ? normale : undefined;
}
