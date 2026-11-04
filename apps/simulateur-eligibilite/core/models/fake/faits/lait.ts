// lait : du lait est demandé. Coché, il est demandé. Proposé sans être coché,
// il est refusé. Une option qui ne s'est pas proposée n'a pas été refusée :
// elle ne vaut « non » que si la boisson l'exclut.

import { unFait } from "../../../socle/index.ts";
import { AVEC, BOISSON, PAS_ENCORE_VALIDES, RIEN_COMMANDE } from "./communs.ts";

export const lait = unFait("lait")
  .nonSi(BOISSON.is("rien"), RIEN_COMMANDE)
  .ouiSi(AVEC.checked("lait"))
  .nonSiEcartee(AVEC, "lait")
  .nonSi(
    AVEC.isValidated().and(AVEC.offered("lait").not()),
    "« lait » ne se sert pas avec cette boisson.",
  )
  .sinon(PAS_ENCORE_VALIDES);
