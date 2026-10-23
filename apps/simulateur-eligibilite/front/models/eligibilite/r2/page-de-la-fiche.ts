// Le résultat d'une issue à fiche patient : le titre du prescripteur, la
// consigne de lui remettre la fiche, puis la fiche. Toute fiche à remettre au
// patient est une feuille, que le socle pose dans sa liseuse, sous ses logos.

import type { CatalogueResultats } from "../../../../core/models/eligibilite/declarations/catalogue-resultats";
import type { FirstResult, Sheet } from "../../../socle";

// La phrase d'introduction est `patientSheetIntro` du catalogue (point 28).
type Catalogue = Pick<CatalogueResultats, "patientSheetIntro">;

export function pageDeLaFeuille(
  { patientSheetIntro }: Catalogue,
  titre: string,
  feuille: Sheet,
): FirstResult {
  return { title: titre, intro: patientSheetIntro, sheet: feuille };
}
