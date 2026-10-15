// Ce que le modèle lit d'une réponse : si la question l'a reçue, et ce qu'elle
// dit de l'aide au patient.

import type { Questions } from "./declarations/questions";

/**
 * La question a-t-elle sa réponse ? Sans réponse, elle attend encore la
 * validation de sa page, ou ne se pose pas.
 */
export function aSaReponse<Reponse>(
  reponse: Reponse | undefined,
): reponse is Reponse {
  return reponse !== undefined;
}

/** Q1.1 dit-elle que le patient se passe d'un professionnel, seul ou aidé d'un proche ? */
export function sansProfessionnel(qui: Questions["Q1.1"] | undefined): boolean {
  return qui === "1_SEUL" || qui === "2_AVEC_UN_PROCHE";
}
