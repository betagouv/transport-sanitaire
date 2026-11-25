// Ce qu'on sait d'un lieu de P3 en arrivant sur sa page
// (`lieux-du-trajet.service.ts`).

import type { Categorie } from "./categories-du-lieu.constants.ts";
import type { Choix } from "./cotes-de-q26.types.ts";
import type { Etablie, Extremite, Nature } from "./roles-dans-le-sens.types.ts";

export type { Choix, Extremite };

/** Ce qu'on sait d'un lieu en arrivant sur sa page. */
export type Lieu = {
  /** Ce que P2 établit, rappelé tel quel. */
  readonly etablie?: Etablie;
  /** La nature précise, établie en P2 ou placée par Q2.6. */
  readonly nature?: Nature;
  /** Les catégories qui lui restent, dans l'ordre de l'écran. */
  readonly categories: readonly Categorie[];
  /** La catégorie certaine : elle ne se demande pas. */
  readonly fixee?: Categorie;
};
