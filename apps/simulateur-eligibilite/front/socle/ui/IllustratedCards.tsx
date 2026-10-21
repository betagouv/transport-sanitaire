// Des cartes illustrées : un dessin, puis un titre et un texte. Trois par
// rangée, une seule colonne sur mobile. Le dessin est décoratif. Sa zone garde
// sa hauteur pendant le chargement comme après un échec : la carte ne bouge
// pas, et un dessin qui manque laisse une zone vide. Les gabarits de l'éditeur
// en font foi. Sans carte, rien ne s'affiche.

import { type ReactNode, useState } from "react";
import "./illustrated-cards.css";

export type IllustratedCard = {
  title: string;
  text: ReactNode;
  /** L'URL du dessin ; sans elle, la zone reste vide. */
  image?: string;
};

type Props = {
  cards: readonly IllustratedCard[];
  /** Le niveau du titre de chaque carte, sous celui de la section. */
  titleLevel?: 3 | 4;
};

export function IllustratedCards({ cards, titleLevel = 3 }: Props) {
  if (cards.length === 0) return null;
  const Title = titleLevel === 3 ? "h3" : "h4";
  return (
    <ul className="socle-illustrated-cards">
      {cards.map((card) => (
        <li key={card.title}>
          <Illustration key={card.image} src={card.image} />
          <div className="socle-illustrated-cards__body">
            <Title className="socle-illustrated-cards__title">
              {card.title}
            </Title>
            <p>{card.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---- implémentation ----

// Un dessin qui ne se charge pas disparaît ; sa zone reste.
function Illustration({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="socle-illustrated-cards__media">
      {src && !failed && (
        <img alt="" src={src} onError={() => setFailed(true)} />
      )}
    </div>
  );
}
