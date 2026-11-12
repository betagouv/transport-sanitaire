// Déclare au serveur une saisie qui enrichit le référentiel : un service saisi
// sous « Autre », ou un établissement saisi avec son service
// (`POST /api/rattachement`). Le serveur les ajoute au référentiel Grist.
//
// L'appel part sans attendre la réponse. Le prescripteur entre dans le
// simulateur même si Grist ne répond pas.

import type { RattachementSaisi } from "../../../shared/rattachement-saisi";
import { ServerApiClient } from "../server-api";

export function declarerLaSaisie(saisie: RattachementSaisi): void {
  new ServerApiClient().post("/rattachement", saisie).catch((err: unknown) => {
    console.error("[simulateur] déclaration du rattachement échouée:", err);
  });
}
