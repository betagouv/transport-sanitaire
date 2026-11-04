// fait_ald_exonerante_3_ou_4 : ALD ouvrant droit au titre du 3° ou du 4° de
// L.160-14 vérifiée.
//
// Le cas 2 de Q1.3 coché dit une prise en charge à 100 %. Q1.3 validée sans
// lui ne dit rien du statut de l'ALD : il reste inconnu.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";

export const aldExonerante3Ou4 = unFait("fait_ald_exonerante_3_ou_4")
  .ouiSi(
    given.question("Q1.3").answer().checked("2_ALD"),
    "Pris en charge à 100 %.",
  )
  .inconnuSi(
    given.question("Q1.3").answer().isPresent(),
    "Sans ALD cochée, son statut reste inconnu.",
  )
  .sinon("Q1.3 n'est pas encore validée.");
