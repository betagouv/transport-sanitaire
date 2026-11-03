// Le sens des transports du document : Q3.1.2 le dit, ou plusieurs
// permissions, chacune un aller-retour, le donnent sans le redemander (D-120).
// Les rôles des lieux (`situations-des-lieux.ts`) et le cerfa le lisent.

import type { GivenAnswer } from "../../../../../socle/index.ts";
import type { Questions } from "../../catalogue/catalogue.ts";
import { given, type Inconnu } from "../../question.ts";

type Sens = Questions["Q3.1.2"];

/** Ce dont le sens du document se tire : Q3.1.2 et la répétition de Q2.8. */
type Origines = {
  readonly sens: GivenAnswer<Sens>;
  readonly repetition: GivenAnswer<Questions["Q2.8.5"]>;
};

/** Le sens du document : Q3.1.2, ou l'aller-retour de plusieurs permissions. */
export function sensDe({ sens, repetition }: Origines): Sens | Inconnu {
  if (sens.hasAnswer()) return sens.value;
  return repetition.is("1_OUI") ? "3_ALLER_RETOUR_EQUIVALENT" : undefined;
}

/** Le sens du document, tel que l'endroit le lit (`sensDe`). */
export const SENS_DU_DOCUMENT = given
  .all({
    sens: given.question("Q3.1.2").answer(),
    repetition: given.question("Q2.8.5").answer(),
  })
  .compute(sensDe);
