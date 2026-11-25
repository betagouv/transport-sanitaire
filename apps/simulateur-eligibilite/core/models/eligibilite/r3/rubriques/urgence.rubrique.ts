// L'urgence, sur la PMT et la DAP. L'appel au SAMU-Centre 15 ne se coche que
// s'il est établi, jamais pour une urgence seulement attestée. « Autres » se
// coche pour l'urgence attestée hors de cet appel, avec sa précision (Q3.5,
// `precision-de-l-urgence.rubrique.ts`) : la condition même qui pose Q3.5, pour
// qu'une précision demandée s'écrive.

import { uneUrgenceHorsCentre15 } from "../../questions/p3/conditions/urgence-hors-centre15.ts";
import { given } from "../../questions/reponses.ts";
import type { Rubrique } from "./rubrique.types.ts";

export type Urgence = {
  readonly urgence_appel15: boolean;
  readonly urgence_autre: boolean;
};

export const URGENCE: Rubrique<Urgence> = {
  urgence_appel15: given.cible("cible_urgence_appel15").isOui(),
  urgence_autre: uneUrgenceHorsCentre15,
};
