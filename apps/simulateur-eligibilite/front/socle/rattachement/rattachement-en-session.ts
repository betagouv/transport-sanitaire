// Le rattachement, gardé le temps de la session. L'écran de rattachement
// l'écrit, l'analytics le relit à chaque évènement : les ids du référentiel,
// sans aucun nom.

import type { RattachementDuReferentiel } from "../../../shared/rattachement-du-referentiel.vo";

export function rangerRattachement(
  rattachement: RattachementDuReferentiel | null,
): void {
  rattachementCourant = rattachement;
}

/** `null` tant que personne ne s'est rattaché. */
export function rattachementEnSession(): RattachementDuReferentiel | null {
  return rattachementCourant;
}

// ---- implémentation ----

// En mémoire seulement, pas de localStorage.
let rattachementCourant: RattachementDuReferentiel | null = null;
