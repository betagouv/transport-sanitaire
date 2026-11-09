// Le sens des transports du document : Q2.13.sens l'a qualifié avant R2
// (#365), sinon Q3.1.2 le dit, ou plusieurs permissions, chacune un
// aller-retour, le donnent sans le redemander (D-120). Les rôles des lieux
// (`roles-dans-le-sens.ts`), Q3.1.1, Q3.4.a et le cerfa le lisent.

import type { AnswerOf, GivenAnswer } from "../../../../../socle/index.ts";
import { Q2_8_5 } from "../../p2/questions/q2-8-5.ts";
import { Q2_13_SENS } from "../../p2/questions/q2-13.ts";
import { given, type Inconnu } from "../../question.ts";
import { Q3_1_2 } from "../questions/q3-1-2.ts";

type Sens = AnswerOf<typeof Q3_1_2>;

/** Les questions qui disent le sens : Q2.13.sens, puis Q3.1.2. */
type Choisi = {
  readonly trajetEvalue: GivenAnswer<AnswerOf<typeof Q2_13_SENS>>;
  readonly sens: GivenAnswer<Sens>;
};

/** Ce dont le sens du document se tire : le sens choisi, et Q2.8.5. */
type Origines = Choisi & {
  readonly repetition: GivenAnswer<AnswerOf<typeof Q2_8_5>>;
};

/** Le sens choisi : en Q2.13.sens, sinon en Q3.1.2. */
export function sensChoisi({ trajetEvalue, sens }: Choisi): Sens | Inconnu {
  return trajetEvalue.hasAnswer() ? trajetEvalue.value : sens.value;
}

/** Le sens du document : le sens choisi, ou l'aller-retour de plusieurs permissions. */
export function sensDe(origines: Origines): Sens | Inconnu {
  const choisi = sensChoisi(origines);
  if (choisi !== undefined) return choisi;
  return origines.repetition.is("1_OUI")
    ? "3_ALLER_RETOUR_EQUIVALENT"
    : undefined;
}

/** Le sens choisi, tel que l'endroit le lit (`sensChoisi`). */
export const SENS_CHOISI = given
  .all({
    trajetEvalue: given.question(Q2_13_SENS).answer(),
    sens: given.question(Q3_1_2).answer(),
  })
  .compute(sensChoisi);

/** Le sens du document, tel que l'endroit le lit (`sensDe`). */
export const SENS_DU_DOCUMENT = given
  .all({
    trajetEvalue: given.question(Q2_13_SENS).answer(),
    sens: given.question(Q3_1_2).answer(),
    repetition: given.question(Q2_8_5).answer(),
  })
  .compute(sensDe);
