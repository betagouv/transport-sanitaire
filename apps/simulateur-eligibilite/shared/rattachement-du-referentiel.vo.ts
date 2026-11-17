// Le rattachement d'un parcours, en ids du référentiel : ce que l'écran de
// rattachement range en session, et ce que chaque événement porte (ADR-0053).
// Rien d'autre : aucun nom, choisi ou saisi, ne part (#506).

import type { RattachementSaisi } from "./rattachement-saisi.ts";
import type { RattachementEnregistre } from "./referentiel.ts";

export class RattachementDuReferentiel {
  readonly etabId?: string;
  /** Jamais sans `etabId` : un service ne se lit que dans son établissement. */
  readonly serviceId?: string;

  private constructor(etabId?: string, serviceId?: string) {
    if (!etabId) return;
    this.etabId = etabId;
    if (serviceId) this.serviceId = serviceId;
  }

  /**
   * Une sélection des listes, ou une structure : ses ids, tels que les listes
   * les donnent. Sans liste des établissements, la saisie n'en a pas.
   */
  static choisi({ etabId, serviceId }: RattachementSaisi) {
    return new RattachementDuReferentiel(etabId, serviceId);
  }

  /** Une saisie libre enregistrée : les ids que le référentiel lui donne. */
  static enregistre({ etabId, serviceId }: RattachementEnregistre) {
    return new RattachementDuReferentiel(etabId, serviceId);
  }

  /**
   * Une saisie libre que le référentiel n'a pas enregistrée : l'établissement
   * des listes, s'il y en a un. Jamais l'id de l'entrée « Autre ».
   */
  static sansReponse({ etabId, etabEstAutre }: RattachementSaisi) {
    return new RattachementDuReferentiel(etabEstAutre ? undefined : etabId);
  }
}
