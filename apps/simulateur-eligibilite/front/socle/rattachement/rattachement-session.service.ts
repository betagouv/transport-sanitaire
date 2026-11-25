// Le rattachement, gardé le temps de la session. L'écran de rattachement
// l'écrit, l'analytics le relit à chaque évènement : les ids du référentiel,
// sans aucun nom.

import type { RattachementDuReferentiel } from "../../../shared/rattachement-du-referentiel.vo";

export class RattachementSessionService {
  // En mémoire seulement, pas de localStorage.
  static #courant: RattachementDuReferentiel | null = null;

  static ranger(rattachement: RattachementDuReferentiel | null): void {
    RattachementSessionService.#courant = rattachement;
  }

  /** `null` tant que personne ne s'est rattaché. */
  static enSession(): RattachementDuReferentiel | null {
    return RattachementSessionService.#courant;
  }
}
