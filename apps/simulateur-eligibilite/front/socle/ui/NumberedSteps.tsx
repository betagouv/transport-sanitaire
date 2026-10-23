// Des étapes à pastille : chacune a un titre précédé de son numéro dans un
// cercle bleu, puis son contenu. Elles se rangent sur deux colonnes, une seule
// sur mobile. Le lecteur d'écran lit le numéro dans le titre (« 1. … »), pas
// la pastille. Les gabarits de l'éditeur en font foi. Sans étape, rien ne
// s'affiche.

import type { ReactNode } from "react";
import "./numbered-steps.css";

type Step = { title: string; content: ReactNode };

type Props = {
  steps: readonly Step[];
  /** Le niveau du titre de chaque étape, sous celui de la section. */
  titleLevel?: 3 | 4;
};

export function NumberedSteps({ steps, titleLevel = 3 }: Props) {
  if (steps.length === 0) return null;
  const Title = titleLevel === 3 ? "h3" : "h4";
  return (
    <div className="socle-numbered-steps">
      {steps.map((step, rang) => (
        <div className="socle-numbered-steps__step" key={step.title}>
          <Title className="socle-numbered-steps__title">
            <span aria-hidden="true" className="socle-numbered-steps__number">
              {rang + 1}
            </span>
            <span className="fr-sr-only">{rang + 1}. </span>
            {step.title}
          </Title>
          {step.content}
        </div>
      ))}
    </div>
  );
}
