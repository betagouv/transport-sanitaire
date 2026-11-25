// L'urgence sur la PMT et la DAP, côté écran : son nom, et comment la
// précision s'écrit sur le cerfa. Sa valeur est du métier
// (`core/models/eligibilite/r3/rubriques/urgence.rubrique.ts` et
// `precision-de-l-urgence.rubrique.ts`).
//
// La précision est un texte strict (T06, R04) : sur une ligne, en 8 pt, ou le
// prescripteur la raccourcit en R3. Le gabarit de la PMT n'a pas de champ pour
// elle : elle s'y dessine.

import type { StrictOptions } from "../../../../socle";

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
