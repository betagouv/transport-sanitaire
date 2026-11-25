// L'assemblage des cas d'usage du cerfa : un par geste de l'écran, branché sur
// le PDF que le conteneur du navigateur choisit.

import type { CerfaPdf } from "./cerfa-pdf.port";
import { GenerateTheCerfa } from "./generate-the-cerfa.usecase";
import { MeasureTheStrictTexts } from "./measure-the-strict-texts.usecase";

/** Générer le cerfa, et mesurer ses textes stricts. */
export type CerfaUseCases = ReturnType<typeof cerfaUseCases>;

export function cerfaUseCases(pdf: CerfaPdf) {
  return {
    generateTheCerfa: new GenerateTheCerfa(pdf),
    measureTheStrictTexts: new MeasureTheStrictTexts(pdf),
  };
}
