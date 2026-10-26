// Un encadré du résultat : un titre, puis son contenu. Le gris, à filet bleu,
// range des éléments séparés d'un trait ; le bleu pâle porte ce que
// le prescripteur transmet. Sur une feuille à remettre, le blanc range un texte
// dans le bloc de suivi. En texte bleu, le blanc encadré de bleu porte un
// rappel, et le blanc bordé de bleu, à filet gauche, met un conseil en avant.
// Sans titre, l'encadré est un aparté que son `label` nomme.
// Les gabarits de l'éditeur en font foi.

import { type ReactNode, useId } from "react";
import "./panel.css";

type Props = {
  variant: "grey" | "blue" | "white" | "framed" | "outlined";
  /** Un trait sépare chaque enfant du suivant. */
  divided?: boolean;
  children: ReactNode;
} & (
  | {
      title: string;
      /** Le niveau du titre, sous celui de la section. */
      titleLevel?: 2 | 3;
    }
  | { label: string }
);

export function Panel({ variant, divided, children, ...named }: Props) {
  const id = useId();
  const classes = ["socle-panel", `socle-panel--${variant}`];
  if (divided) classes.push("socle-panel--divided");
  const body = <div className="socle-panel__body">{children}</div>;
  if ("label" in named) {
    return (
      <aside aria-label={named.label} className={classes.join(" ")}>
        {body}
      </aside>
    );
  }
  const Title = named.titleLevel === 3 ? "h3" : "h2";
  return (
    <section aria-labelledby={id} className={classes.join(" ")}>
      <Title className="socle-panel__title" id={id}>
        {named.title}
      </Title>
      {body}
    </section>
  );
}
