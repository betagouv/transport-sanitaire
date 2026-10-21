// Le bloc de suivi d'une feuille à remettre : sur un fond gris clair arrondi,
// ce que le patient fait ensuite et ce qu'il doit savoir. À l'impression, il
// ne se coupe pas : s'il ne tient pas sous le reste, il ouvre la seconde A4.
// Les gabarits de l'éditeur en font foi.

import type { ReactNode } from "react";
import "./sheet-follow-up.css";

export function SheetFollowUp({ children }: { children: ReactNode }) {
  return <div className="socle-sheet-follow-up">{children}</div>;
}
