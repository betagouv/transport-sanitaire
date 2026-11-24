// Enregistrer le rattachement validé : en tirer les ids du référentiel que le
// parcours portera. Une saisie libre attend que le référentiel la crée, pour
// partir avec ses ids dès cette visite. S'il ne répond pas, le prescripteur
// entre quand même, sans ces ids. Voir
// docs/knowledge/domain/rattachement.md.

import { RattachementDuReferentiel } from "../../../shared/rattachement-du-referentiel.vo";
import {
  enrichitLeReferentiel,
  type RattachementSaisi,
} from "../../../shared/rattachement-saisi";
import type { Referentiel } from "../../../shared/referentiel";

export class RegisterTheRattachement {
  readonly #referentiel: Referentiel;

  constructor(referentiel: Referentiel) {
    this.#referentiel = referentiel;
  }

  async execute(saisie: RattachementSaisi): Promise<RattachementDuReferentiel> {
    if (!enrichitLeReferentiel(saisie)) {
      return RattachementDuReferentiel.choisi(saisie);
    }
    try {
      const enregistre = await this.#referentiel.enrichirDepuisSaisie?.(saisie);
      if (enregistre) return RattachementDuReferentiel.enregistre(enregistre);
    } catch (err) {
      console.warn("[simulateur] saisie non enregistrée au référentiel:", err);
    }
    return RattachementDuReferentiel.sansReponse(saisie);
  }
}
