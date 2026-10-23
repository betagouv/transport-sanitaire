// Des cartes illustrées : un dessin, puis un titre et un texte. Trois par
// rangée, une seule colonne sur mobile. Une carte peut être retenue : bordée de
// vert, elle porte un badge et se lit comme l'élément courant de la liste. Le
// dessin est décoratif. Tant qu'il se charge, il est masqué et sa zone dit
// « En cours de chargement », en statut que le lecteur d'écran annonce. Un
// dessin qui ne se charge pas laisse sa zone vide. Dans les trois cas, la zone
// garde sa hauteur : la carte ne bouge pas. Les gabarits de l'éditeur en font
// foi. Sans carte, rien ne s'affiche.

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

type Status = "loading" | "loaded" | "failed";

// Le dessin et son état. La clé de son `src` le remonte quand il change : un
// événement tardif de l'ancien dessin ne touche pas le nouveau.
function Illustration({ src }: { src?: string }) {
  const [status, setStatus] = useState<Status>("loading");
  if (!src || status === "failed") return null;
  return (
    <>
      <img
        alt=""
        hidden={status === "loading"}
        src={src}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("failed")}
      />
      {status === "loading" && (
        <p className="socle-illustrated-cards__loading" role="status">
          En cours de chargement
        </p>
      )}
    </>
  );
}
