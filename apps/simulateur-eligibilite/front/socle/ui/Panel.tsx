// Un encadré du résultat : un titre, puis son contenu, sur un fond teinté à
// filet bleu. Le gris range des éléments séparés d'un trait ; le bleu pâle
// porte ce que l'utilisateur transmet. Les gabarits de l'éditeur en font foi.

import { type ReactNode, useId } from "react";
import "./panel.css";

type Props = {
  variant: "grey" | "blue";
  title: string;
  /** Un trait sépare chaque enfant du suivant. */
  divided?: boolean;
  children: ReactNode;
};

export function Panel({ variant, title, divided, children }: Props) {
  const id = useId();
  const classes = ["socle-panel", `socle-panel--${variant}`];
  if (divided) classes.push("socle-panel--divided");
  return (
    <section aria-labelledby={id} className={classes.join(" ")}>
      <h2 className="fr-h5" id={id}>
        {title}
      </h2>
      <div className="socle-panel__body">{children}</div>
    </section>
  );
}
