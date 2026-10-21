// Le résultat d'une issue à fiche patient : le titre du prescripteur, la
// consigne de lui remettre la fiche, puis la fiche. Elle est le corps de la
// page que le socle compose, ou la feuille qu'il pose sous ses logos.

import type { ReactNode } from "react";
import type { FirstResult, Sheet } from "../../../socle";
import type { CatalogueResultats } from "../declarations/catalogue-resultats";

// La phrase d'introduction est `patientSheetIntro` du catalogue (point 28).
type Catalogue = Pick<CatalogueResultats, "patientSheetIntro">;

export function pageDeLaFiche(
  { patientSheetIntro }: Catalogue,
  titre: string,
  fiche: ReactNode,
): FirstResult {
  return { title: titre, intro: patientSheetIntro, body: fiche };
}

export function pageDeLaFeuille(
  { patientSheetIntro }: Catalogue,
  titre: string,
  feuille: Sheet,
): FirstResult {
  return { title: titre, intro: patientSheetIntro, sheet: feuille };
}
