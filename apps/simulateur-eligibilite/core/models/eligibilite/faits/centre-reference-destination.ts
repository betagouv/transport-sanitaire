// fait_centre_reference_destination : le centre de référence est la
// destination réelle.
//
// Aucune question avant le verrou ne le pose : Q3.4.a, en P3, précise le
// document sans requalifier P2 (D-117).
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { Fait } from "../../../socle/index.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const centreReferenceDestination: DeclarationDeFait = () =>
  Fait.inconnu(
    "Aucune question avant le verrou ne le pose : Q3.4.a, en P3, précise le document sans requalifier P2 (D-117).",
  );
