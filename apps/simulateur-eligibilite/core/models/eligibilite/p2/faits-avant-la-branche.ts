// Les faits que les pages de P2 avant la branche établissent : le mode, le
// trajet, la prestation, les contextes, le transfert, la permission, le retour
// pénitentiaire et la convocation. La page de branche (Q2.12 à Q2.14) les lit pour savoir si l'une
// de ses questions est utile.

import type { ValidatedAnswers } from "../../../socle/index.ts";
import { AUCUN_FAIT, type Faits } from "../declarations/faits.ts";
import type { Questions } from "../declarations/questions.ts";
import { EXCLUSION_DU_TRANSPORT } from "../exclusion-du-transport.ts";
import { faitsDuMode } from "../p1/mode-de-transport.ts";
import { faitsDesContextes } from "./contextes.ts";
import { faitsDeLaConvocation } from "./convocation.ts";
import { faitsDeLaPermission } from "./permission.ts";
import { faitsDeLaPrestation } from "./prestation.ts";
import { faitsDuRetourPenitentiaire } from "./retour-penitentiaire.ts";
import { faitsDuTrajet } from "./trajet.ts";
import { faitsDuTransfert } from "./transfert.ts";

export function faitsAvantLaBranche(
  validated: ValidatedAnswers<Questions>,
): Faits {
  return {
    ...AUCUN_FAIT,
    ...faitsDuMode(validated),
    ...faitsDuTrajet(validated),
    ...faitsDeLaPrestation(validated),
    ...faitsDesContextes(validated),
    // Après les contextes : un positif de Q2.5 ou Q2.6 l'emporte sur le « non » de Q2.2.1.
    ...faitsDuTransfert(validated),
    ...faitsDeLaPermission(validated),
    // Après la permission et le transfert : une sortie définitive vers la prison les écarte.
    ...faitsDuRetourPenitentiaire(validated),
    // Après les contextes : la branche de la convocation l'emporte sur le « À qualifier » de Q2.2.1.b.
    ...faitsDeLaConvocation(validated),
    fait_exclusion_transport_prouvee: EXCLUSION_DU_TRANSPORT,
  };
}
