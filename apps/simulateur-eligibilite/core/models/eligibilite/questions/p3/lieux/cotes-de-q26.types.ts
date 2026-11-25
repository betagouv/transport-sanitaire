// Les placements des natures de Q2.6 sur les deux lieux, et ce que P3 en a déjà
// dit (`cotes-de-q26.service.ts`).

import type { NatureDeQ26 } from "../../p2/lieux/roles-des-lieux.types.ts";
import type { Categorie } from "./categories-du-lieu.constants.ts";
import type { Extremite } from "./roles-dans-le-sens.types.ts";

export type { NatureDeQ26 };

/** Où se trouve une nature de Q2.6 : un côté, ou les deux. */
export type Placement = Extremite | "les_deux";

/** Le placement de chaque nature de Q2.6, quand on le connaît. */
export type Repartition = { readonly [Nature in NatureDeQ26]?: Placement };

/** Ce que P3 a déjà dit des lieux : leur catégorie, le côté répondu. */
export type Choix = {
  readonly categories?: { readonly [Lieu in Extremite]?: Categorie };
  readonly cotes?: Repartition;
};
