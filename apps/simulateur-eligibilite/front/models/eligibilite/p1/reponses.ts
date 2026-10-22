// Ce que le modèle lit de Q1.1 : qui aide le patient pendant le trajet.

import type { GivenAnswer } from "../../../socle";
import type { Questions } from "../declarations/questions";

/** Q1.1 dit-elle que le patient se passe d'un professionnel, seul ou aidé d'un proche ? */
export function sansProfessionnel(
  qui: GivenAnswer<Questions["Q1.1"]>,
): boolean {
  return qui.isOneOf("1_SEUL", "2_AVEC_UN_PROCHE");
}
