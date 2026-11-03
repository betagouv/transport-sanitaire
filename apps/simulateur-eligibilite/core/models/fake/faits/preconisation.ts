// Des réponses aux faits : ce qui est commandé, en toutes lettres, et ce qu'on
// sait du lait et du citron (`index.ts`).

import type { GivenAnswers, ValidatedAnswers } from "../../../socle/index.ts";
import type { Questions } from "../questions/catalogue.ts";
import { CATALOGUE_DES_FAITS } from "./index.ts";
import type { Faits } from "./noms.ts";

export function faits(
  _answers: GivenAnswers<Questions>,
  validated: ValidatedAnswers<Questions>,
): Faits {
  return CATALOGUE_DES_FAITS.read(validated);
}
