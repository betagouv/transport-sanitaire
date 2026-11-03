// La permission d'un patient de moins de 20 ans : ce que toutes les questions
// de Q2.8 lisent de Q2.7 et de Q2.8.5 (D-107). Ses faits vivent sous `faits/`.

import { given } from "../../question.ts";

/** Q2.7 dit un patient de moins de 20 ans : Q2.8 se pose alors. */
export const unMineurDeVingtAns = given
  .question("Q2.7")
  .answer()
  .isOneOf("1_MOINS_DE_SEIZE_ANS", "2_SEIZE_A_DIX_NEUF_ANS");

/** Q2.8.5 dit plusieurs permissions, pour un patient de moins de 20 ans. */
export const plusieursPermissions = unMineurDeVingtAns.and(
  given.question("Q2.8.5").answer().is("1_OUI"),
);
