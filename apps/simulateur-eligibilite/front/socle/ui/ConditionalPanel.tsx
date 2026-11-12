// Le panneau des précisions qu'une option fait apparaître, juste sous elle :
// hors de son libellé et de sa zone cliquable, il dit quelle réponse l'a
// ouvert et où la liste reprend. Fermé, il n'existe pas : ni fond ni marge, et
// ses champs sortent de l'ordre de tabulation.

import type { ReactNode } from "react";
import "./conditional-panel.css";

export function ConditionalPanel({ children }: { children: ReactNode }) {
  return <div className="socle-conditional-panel">{children}</div>;
}
