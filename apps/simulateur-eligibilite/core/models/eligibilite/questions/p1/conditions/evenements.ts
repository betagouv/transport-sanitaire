// La date d'un accident : réelle, et au plus tard aujourd'hui, au jour civil de
// Paris (module 02, SQ-27). Une date future est une erreur de la saisie
// elle-même : elle grise « Suivant », et le calendrier ne la propose pas.
// L'accident causé par un tiers (Q1.3) et l'AT/MP (Q3.6.1) la bornent ainsi.

import { LocalDateTime } from "../../../../../socle/index.ts";

/** Au plus tard aujourd'hui, à Paris. */
export function jusquAujourdhui(): { max?: string } {
  return { max: LocalDateTime.dayInParis(new Date()).day() };
}
