// citron : du citron est demandé. « Peut-être du citron » le laisse inconnu :
// à décider au service. Pour le reste, comme le lait.

import { unFait } from "../../../socle/index.ts";
import { AVEC, BOISSON, PAS_ENCORE_VALIDES, RIEN_COMMANDE } from "./communs.ts";

export const citron = unFait("citron")
  .nonSi(BOISSON.is("rien"), RIEN_COMMANDE)
  .inconnuSi(
    AVEC.checked("citron-a-voir"),
    "« Peut-être du citron » : à décider au service.",
  )
  .ouiSi(AVEC.checked("citron"))
  .nonSiEcartee(AVEC, "citron")
  .nonSi(
    AVEC.isValidated().and(AVEC.offered("citron").not()),
    "« citron » ne se sert pas avec cette boisson.",
  )
  .sinon(PAS_ENCORE_VALIDES);
