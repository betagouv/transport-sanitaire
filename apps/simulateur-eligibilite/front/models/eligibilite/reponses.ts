// Ce que le modèle lit de Q1.1 : qui aide le patient pendant le trajet.

import type { Questions } from "./declarations/questions";

/** Q1.1 dit-elle que le patient se passe d'un professionnel, seul ou aidé d'un proche ? */
export function sansProfessionnel(qui: Questions["Q1.1"] | undefined): boolean {
  return qui === "1_SEUL" || qui === "2_AVEC_UN_PROCHE";
}
