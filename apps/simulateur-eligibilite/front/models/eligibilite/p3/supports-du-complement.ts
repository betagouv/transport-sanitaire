// Les supports que P3 complète : ce que chacun réclame décide de ce qui se pose.

import type { Cibles } from "../declarations/cibles";

/** La PMT (S3138g) et la DAP (S3139h) : un sens, une rubrique médicale. */
export function pmtOuDap(cibles: Cibles): boolean {
  return (
    cibles.cible_support_id === "S3138g" || cibles.cible_support_id === "S3139h"
  );
}

/** Les trois supports de P3, S3141 compris, ont un départ et une arrivée. */
export function avecUnDocument(cibles: Cibles): boolean {
  return cibles.cible_support_id !== "AUCUN";
}
