// Le premier résultat du modèle de démonstration (R2) : ce que dit la
// commande. Il lit la commande, son lait, les façons de servir. Son rendu est
// dans `front/models/fake/`.

import type { ValueOf } from "../../../socle/index.ts";
import { given } from "../questions/reponses.ts";

// Ce que lit R2 : la commande, son lait, les façons de servir.
const LU_PAR_LE_RESULTAT = given.all({
  commande: given.cible("commande"),
  tourne: given.cible("lait_tourne"),
  service: given
    .question("service")
    .answer()
    .compute((service) => service.checkedBoxes()),
});

/** Ce que R2 reçoit du socle : `R2.lit`. */
export type LuParLeResultat = ValueOf<typeof LU_PAR_LE_RESULTAT>;

export const R2 = {
  /** Ce que lit R2 : la commande, son lait, les façons de servir. */
  lit: LU_PAR_LE_RESULTAT,
};
