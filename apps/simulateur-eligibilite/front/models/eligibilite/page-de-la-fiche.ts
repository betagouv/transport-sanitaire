// Le résultat d'une issue à fiche patient : le titre du prescripteur, la
// consigne de lui remettre la fiche, puis la fiche. Elle est le corps de la
// page que le socle compose, ou la feuille qu'il pose sous ses logos.

import type { ReactNode } from "react";
import type { FirstResult, Sheet } from "../../socle";

// La phrase d'introduction vient de l'aperçu de l'éditeur : le catalogue ne la
// porte pas.
const INTRO =
  "Vous trouverez ci-dessous une fiche explicative officielle de l’Assurance Maladie à remettre à votre patient.";

export function pageDeLaFiche(titre: string, fiche: ReactNode): FirstResult {
  return { title: titre, intro: INTRO, body: fiche };
}

export function pageDeLaFeuille(titre: string, feuille: Sheet): FirstResult {
  return { title: titre, intro: INTRO, sheet: feuille };
}
