// Les textes de R2 tels que l'écran les attend : le catalogue de l'éditeur
// (`core/models/eligibilite/r2/catalogue.ts`), chargé une fois par session, ou
// l'échec de son chargement.

import type { CatalogueResultats } from "../../../../../core/models/eligibilite/r2/blocs/forme-du-catalogue";
import { catalogueResultats } from "../../../../../core/models/eligibilite/r2/catalogue";

/** Le catalogue chargé, ou l'échec du chargement : le réseau peut manquer. */
export type Chargement =
  | { readonly catalogue: CatalogueResultats }
  | { readonly echec: true };

/**
 * La même promesse à chaque appel, pour qu'un composant la lise avec `use()`
 * sans la recréer à chaque affichage. Elle ne rejette jamais ; un échec est
 * oublié, pour que l'affichage suivant retente le chargement.
 */
export function catalogueDeLaSession(): Promise<Chargement> {
  attente ??= catalogueResultats().then(
    (catalogue) => ({ catalogue }),
    () => {
      attente = undefined;
      return { echec: true } as const;
    },
  );
  return attente;
}

// ---- implémentation ----

let attente: Promise<Chargement> | undefined;
