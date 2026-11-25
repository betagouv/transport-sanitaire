// Les trois documents de R3 tels que le socle les remplit : le cerfa de
// l'écran, lié aux valeurs du métier pour le même support.

import { R3 } from "../../../core/models/eligibilite/r3/r3";
import { ENDROITS } from "../../../front/models/eligibilite/r3/documents";

const lier = <Support extends keyof typeof ENDROITS>(support: Support) =>
  ({ cerfa: ENDROITS[support], mapping: R3.valeurs[support] }) as {
    cerfa: (typeof ENDROITS)[Support];
    mapping: (typeof R3.valeurs)[Support];
  };

export const DOCUMENTS = {
  S3138g: lier("S3138g"),
  S3139h: lier("S3139h"),
  S3141: lier("S3141"),
};
