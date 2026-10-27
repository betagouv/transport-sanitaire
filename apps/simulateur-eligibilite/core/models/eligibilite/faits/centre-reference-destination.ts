// fait_centre_reference_destination : le centre de référence est la
// destination réelle.
//
// Aucune question avant le verrou ne le pose : Q3.4.a, en P3, précise le
// document sans requalifier P2 (D-117).
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";

export const centreReferenceDestination = unFait(
  "fait_centre_reference_destination",
).sinon(
  "Aucune question avant le verrou ne le pose : Q3.4.a, en P3, précise le document sans requalifier P2 (D-117).",
);
