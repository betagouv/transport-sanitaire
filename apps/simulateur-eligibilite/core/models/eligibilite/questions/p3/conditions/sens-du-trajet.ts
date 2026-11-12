// Le sens des transports du document : Q2.13.sens l'a qualifié avant R2
// (#365), sinon Q3.1.2 le dit. Plusieurs permissions (Q2.8.5) ne disent aucun
// sens, même chacune un aller-retour (D-284). Les rôles des lieux
// (`roles-dans-le-sens.ts`), Q3.1.1, Q3.4.a et le cerfa le lisent.

import type { AnswerOf, GivenAnswer } from "../../../../../socle/index.ts";
import { Q2_13_SENS } from "../../p2/questions/q2-13.ts";
import { given, type Inconnu } from "../../question.ts";
import { Q3_1_2 } from "../questions/q3-1-2.ts";

type Sens = AnswerOf<typeof Q3_1_2>;

/** Les questions qui disent le sens : Q2.13.sens, puis Q3.1.2. */
type Choisi = {
  readonly trajetEvalue: GivenAnswer<AnswerOf<typeof Q2_13_SENS>>;
  readonly sens: GivenAnswer<Sens>;
};

/** Le sens choisi : en Q2.13.sens, sinon en Q3.1.2. */
export function sensChoisi({ trajetEvalue, sens }: Choisi): Sens | Inconnu {
  return trajetEvalue.hasAnswer() ? trajetEvalue.value : sens.value;
}

/** Le sens choisi, tel que l'endroit le lit (`sensChoisi`). */
export const SENS_CHOISI = given
  .all({
    trajetEvalue: given.question(Q2_13_SENS).answer(),
    sens: given.question(Q3_1_2).answer(),
  })
  .compute(sensChoisi);
