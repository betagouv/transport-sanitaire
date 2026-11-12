// Déclare au serveur une saisie qui enrichit le référentiel : un service saisi
// sous « Autre », ou un établissement saisi avec son service
// (`POST /api/rattachement`). Le serveur les ajoute au référentiel Grist.
//
// L'appel part sans attendre la réponse. Le prescripteur entre dans le
// simulateur même si Grist ne répond pas.

import type { RattachementSaisi } from "../../../shared/rattachement-saisi";
import type { ServerApiClient } from "../server-api";

/** La déclaration d'une saisie, par le client que le conteneur donne. */
export function declarerAuServeur(
  api: ServerApiClient,
): (saisie: RattachementSaisi) => void {
  return (saisie) => {
    api.post("/rattachement", saisie).catch((err: unknown) => {
      console.error("[simulateur] déclaration du rattachement échouée:", err);
    });
  };
}
