// Des étapes en cartes numérotées, sous leur titre : trois par rangée, deux
// quand il n'y en a que deux, une seule colonne sur mobile. Le numéro vient de
// la liste ordonnée, au-dessus de chaque carte. Sans étape, rien ne s'affiche.

import { useId } from "react";
import "./numbered-cards.css";

type Props = { title: string; items: readonly string[] };

export function NumberedCards({ title, items }: Props) {
  const id = useId();
  if (items.length === 0) return null;
  const classes = ["socle-numbered-cards"];
  if (items.length === 2) classes.push("socle-numbered-cards--two");
  return (
    <section aria-labelledby={id} className="socle-numbered-cards__section">
      <h2 className="fr-h5" id={id}>
        {title}
      </h2>
      <ol className={classes.join(" ")}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  );
}
