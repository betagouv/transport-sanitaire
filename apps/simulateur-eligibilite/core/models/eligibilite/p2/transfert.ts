// Le transfert et l'article 80 : quand Q2.5, Q2.6.a et Q2.6 se posent (D-106).
// Les exceptions qui se proposent se lisent dans `ExceptionsDeLArticle80`, et
// les faits du transfert vivent sous `faits/`.

import type { ValidatedAnswers } from "../../../socle/index.ts";
import { RetourPenitentiaire } from "../concepts/retour-penitentiaire.ts";
import { Sejour } from "../concepts/sejour.ts";
import type { Questions } from "../declarations/questions.ts";

type Valides = ValidatedAnswers<Questions>;

/**
 * Q2.5 se pose-t-elle ? Q2.1 dit un transfert, ou Q2.2.1.a écarte la
 * permission : un déplacement pendant l'hospitalisation, au type à préciser.
 * Une sortie définitive vers la prison n'en est pas un (TS1012-04).
 */
export function transfertAPoser(validated: Valides): boolean {
  return (
    (validated.question("Q2.1").is("9_TRANSFERT") ||
      validated.question("Q2.2.1.a").is("2_NON")) &&
    !RetourPenitentiaire.of(validated).estUneSortieVersLaPrison()
  );
}

/** Q2.5 dit-elle un transfert entre établissements ? Q2.6.a se pose alors. */
export function typeAPoser(validated: Valides): boolean {
  return validated.question("Q2.5").is("1_TRANSFERT");
}

/**
 * Le champ I de l'article 80 est-il ouvert ? Un transfert, un autre
 * déplacement pendant un séjour coché, ou une admission en HAD que Q2.1.g
 * établit : Q2.6 se pose alors, sans Q2.5 pour la HAD.
 */
export function champIOuvert(validated: Valides): boolean {
  const deplacement = validated.question("Q2.5");
  return (
    deplacement.is("1_TRANSFERT") ||
    (deplacement.is("2_AUTRE_DEPLACEMENT") &&
      Sejour.of(validated).estCoche()) ||
    validated.question("Q2.1.g").is("3_ADMISSION_HAD")
  );
}
