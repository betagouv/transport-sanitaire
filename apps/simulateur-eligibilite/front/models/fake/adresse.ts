// Une adresse en une ligne, pour la relire à l'écran et sur le bon de commande.

import type { Address } from "../../socle";

// Une adresse est un objet : ses champs se lisent un par un.
export function enUneLigne(adresse: Address): string {
  const { placeName, street, complement, postalCode, city, country } = adresse;
  const commune = [postalCode, city].filter(Boolean).join(" ");
  return [placeName, street, complement, commune, country]
    .filter(Boolean)
    .join(", ");
}
