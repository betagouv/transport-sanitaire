// La permission : quand ses options adultes se proposent en Q2.7 (D-107). Ses
// faits vivent sous `faits/`, et ce qu'en lisent plusieurs dans `Permission`.

import type { ValidatedAnswers } from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";

type Valides = ValidatedAnswers<Questions>;

/**
 * Les options adultes de Q2.7 se proposent-elles ? Pas si Q1.3 dit un patient
 * de moins de 18 ans : un fait acquis retire les choix qu'il contredit.
 */
export function optionsAdultesAProposer(validated: Valides): boolean {
  return !validated.question("Q1.3").checked("8_MINEUR_SOINS_CONTINUS");
}
