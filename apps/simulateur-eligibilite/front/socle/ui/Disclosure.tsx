// Un bloc dépliable : un résumé toujours visible, puis son contenu, déplié à
// l'arrivée. C'est le `<details>` du navigateur : il se plie au clavier sans
// script, et le lecteur d'écran dit s'il est ouvert. Les gabarits de l'éditeur
// en font foi.

import type { ReactNode } from "react";
import "./disclosure.css";

type Props = {
  summary: string;
  children: ReactNode;
};

export function Disclosure({ summary, children }: Props) {
  return (
    <details className="socle-disclosure" open>
      <summary>{summary}</summary>
      <div className="socle-disclosure__body">{children}</div>
    </details>
  );
}
