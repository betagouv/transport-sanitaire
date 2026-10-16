// Des cartes illustrées : un dessin, puis un titre et un texte. Trois par
// rangée, une seule colonne sur mobile. Une carte peut être retenue : bordée de
// vert, elle porte un badge et se lit comme l'élément courant de la liste. Le
// dessin est décoratif. Sa zone garde
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
  selected?: boolean;
};

type Props = {
  cards: readonly IllustratedCard[];
  /** Le niveau du titre de chaque carte, sous celui de la section. */
  titleLevel?: 3 | 4;
  /** Le badge de la carte retenue. */
  selectedLabel?: string;
};

export function IllustratedCards({
  cards,
  titleLevel = 3,
  selectedLabel,
}: Props) {
  if (cards.length === 0) return null;
  return (
    <ul className="socle-illustrated-cards">
      {cards.map((card) => (
        <Card
          card={card}
          key={card.title}
          selectedLabel={selectedLabel}
          titleLevel={titleLevel}
        />
      ))}
    </ul>
  );
}

// ---- implémentation ----

type CardProps = Required<Pick<Props, "titleLevel">> &
  Pick<Props, "selectedLabel"> & { card: IllustratedCard };

function Card({ card, titleLevel, selectedLabel }: CardProps) {
  const Title = titleLevel === 3 ? "h3" : "h4";
  return (
    <li
      aria-current={card.selected ? "true" : undefined}
      className={
        card.selected ? "socle-illustrated-cards--selected" : undefined
      }
    >
      <div className="socle-illustrated-cards__media">
        {card.selected && selectedLabel && (
          <p className="fr-badge fr-badge--success">{selectedLabel}</p>
        )}
        <Illustration key={card.image} src={card.image} />
      </div>
      <div className="socle-illustrated-cards__body">
        <Title className="socle-illustrated-cards__title">{card.title}</Title>
        <p>{card.text}</p>
      </div>
    </li>
  );
}

// Un dessin qui ne se charge pas disparaît ; sa zone reste.
function Illustration({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return <img alt="" src={src} onError={() => setFailed(true)} />;
}
