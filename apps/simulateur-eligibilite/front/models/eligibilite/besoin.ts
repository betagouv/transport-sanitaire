// Le besoin dit en Q0.1 : vérifier une éligibilité, ou aller jusqu'à la
// prescription. Q0.1 n'a pas d'effet sur l'éligibilité. Le socle s'en sert pour
// placer l'avis, et le journal des parcours le reçoit au premier choix validé.
// Sans réponse, il n'est pas connu.

import { given } from "../../../core/models/eligibilite/questions/reponses";
import type { Intent } from "../../socle";

export const BESOIN = given
  .question("Q0.1")
  .answer()
  .compute((besoin): Intent | null => {
    if (besoin.is("1_VERIFIER")) return "check";
    if (besoin.is("2_VERIFIER_ET_PRESCRIRE")) return "prescribe";
    return null;
  });
