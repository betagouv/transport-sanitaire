// Des réponses aux faits : ce que les règles de l'éditeur reçoivent.
//
// Q0.1 dit un besoin, pas un fait. Aucune autre partie n'est encore posée :
// chaque fait reste absent, et les règles ne décident rien.

import type { Faits } from "./declarations/faits";
import { FAITS } from "./declarations/faits";

export function faits(): Faits {
  return Object.fromEntries(
    FAITS.map((fait) => [
      fait,
      { provenance: "Aucune question ne l'établit encore." },
    ]),
  ) as Faits;
}
