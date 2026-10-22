// Les dessins des trois modes de transport, ceux des cartes des fiches patient.
// Ils viennent des gabarits de l'éditeur (v10.1.2), allégés en WebP. Le
// catalogue range ses cartes dans cet ordre : le véhicule personnel ou les
// transports en commun, le VSL ou le taxi conventionné, l'ambulance.

import ambulance from "./illustrations/ambulance.webp";
import vehiculePersonnel from "./illustrations/vehicule-personnel.webp";
import vslOuTaxi from "./illustrations/vsl-ou-taxi.webp";

const DESSINS = [vehiculePersonnel, vslOuTaxi, ambulance];

/** Une carte en trop, qui n'a pas de dessin. */
type SansDessin = undefined;

/** Le dessin de la carte de ce rang ; une carte en trop n'en a pas. */
export function illustrationDuMode(rang: number): string | SansDessin {
  return DESSINS[rang];
}
