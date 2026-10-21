// Le résultat d'une issue à fiche patient : le titre du prescripteur, la
// consigne de lui remettre la fiche, puis la fiche, qui est le corps de la
// page que le socle compose.

import type { ReactNode } from "react";
import type { FirstResult } from "../../socle";

// La phrase d'introduction vient de l'aperçu de l'éditeur : le catalogue ne la
// porte pas.
export function pageDeLaFiche(titre: string, fiche: ReactNode): FirstResult {
  return {
    title: titre,
    intro:
      "Vous trouverez ci-dessous une fiche explicative officielle de l’Assurance Maladie à remettre à votre patient.",
    body: fiche,
  };
}
