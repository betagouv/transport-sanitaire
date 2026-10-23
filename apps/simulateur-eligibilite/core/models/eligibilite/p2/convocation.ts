// La convocation : quand Q2.10 se pose (D-108). Son fait vit sous `faits/`.

import type { ValidatedAnswers } from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";

type Valides = ValidatedAnswers<Questions>;

/**
 * Une convocation est-elle annoncée, par Q2.1 ou par Q2.2.1.b ? Q2.10 se pose
 * alors. Sans l'une ni l'autre, elle ne se pose pas : la convocation proposée
 * et écartée en Q2.2.1 vaut déjà « non » (contextes).
 */
export function convocationAnnoncee(validated: Valides): boolean {
  return (
    validated.question("Q2.1").is("12_CONVOCATION") ||
    validated.question("Q2.2.1.b").checked("13_CONVOCATION")
  );
}
