// Déclare au serveur une saisie qui enrichit le référentiel : un service saisi
// sous « Autre », ou un établissement saisi avec son service
// (`POST /api/rattachement`). Le serveur les ajoute au référentiel Grist.
//
// L'appel part sans attendre la réponse. Le prescripteur entre dans le
// simulateur même si Grist ne répond pas.

import type { RattachementSaisi } from "../../../shared/rattachement-saisi";

export function declarerLaSaisie(saisie: RattachementSaisi): void {
  fetch("/api/rattachement", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(saisie),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`/api/rattachement → HTTP ${res.status}`);
    })
    .catch((err: unknown) => {
      console.error("[simulateur] déclaration du rattachement échouée:", err);
    });
}
