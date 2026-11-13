// Un événement de la mesure d'audience : son nom, pris dans une liste fermée, le
// service rattaché, et une valeur numérique. Rien des réponses.
// Voir docs/knowledge/adr/analytics.md, ADR-2 et §4.

import type { RattachementSaisi } from "../../../shared/rattachement-saisi";

/**
 * La liste des événements. Chaque nom est fixe : un nom composé à l'appel ne
 * compile pas.
 *
 * Elle couvre le questionnaire : son début, ses étapes, sa fin, son abandon.
 * Puis le verdict d'un parcours ALD à son arrivée sur le premier résultat
 * (#148).
 *
 * Un objet `as const`, pas un `enum` : `erasableSyntaxOnly` (tsconfig) interdit
 * l'`enum`.
 */
export const EventName = {
  simulationStart: "simulation_start",
  simulationStep: "simulation_step",
  simulationComplete: "simulation_complete",
  simulationAbandon: "simulation_abandon",
  aldWithinTarget: "parcours_ald_dans_la_cible",
  aldTooManyPages: "parcours_ald_trop_de_pages",
  aldTooManyQuestions: "parcours_ald_trop_de_questions",
  aldCaisse: "parcours_ald_caisse",
} as const;

export type AudienceEventName = (typeof EventName)[keyof typeof EventName];

export class AudienceEvent {
  readonly name: AudienceEventName;
  readonly serviceId?: string;
  readonly value?: number;

  constructor(name: AudienceEventName, serviceId?: string, value?: number) {
    this.name = name;
    this.serviceId = serviceId;
    this.value = value;
  }

  /**
   * L'événement, avec l'id du service rattaché s'il y en a un. Le service libre
   * saisi sous « Autre » ne part jamais : l'événement garde l'id de l'entrée
   * « Autre ».
   */
  static of(
    name: AudienceEventName,
    rattachement: RattachementSaisi | null,
    value?: number,
  ): AudienceEvent {
    return new AudienceEvent(name, rattachement?.serviceId, value);
  }
}
