// Le bloc de suivi d'une feuille à remettre : sur un fond gris clair arrondi,
// ce que le patient fait ensuite et ce qu'il doit savoir. À l'impression, il
// ouvre la seconde A4 quand la feuille n'en tient pas une, et ne se coupe que
// s'il est plus haut qu'une page (sheet-pagination.ts). Les gabarits de
// l'éditeur en font foi.

import type { ReactNode } from "react";
import "./sheet-follow-up.css";

export function SheetFollowUp({ children }: { children: ReactNode }) {
  return <div className="socle-sheet-follow-up">{children}</div>;
}
