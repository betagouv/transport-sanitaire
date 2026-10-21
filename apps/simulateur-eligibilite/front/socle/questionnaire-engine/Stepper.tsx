// Le stepper du simulateur : « Étape n sur N ». Il compte des parties, jamais
// des pages. Le questionnaire l'affiche, les résultats aussi, avec un titre et
// une ligne qui dit ce qui suit.

import type { ReactNode } from "react";

type Props = {
  part: number;
  total: number;
  title?: string;
  details?: ReactNode;
};

export function Stepper({ part, total, title, details }: Props) {
  return (
    <div className="fr-stepper" style={{ marginBottom: "2rem" }}>
      <h2 className="fr-stepper__title">
        {title && `${title} `}
        <span className="fr-stepper__state">
          Étape {part} sur {total}
        </span>
      </h2>
      <div
        className="fr-stepper__steps"
        data-fr-current-step={part}
        data-fr-steps={total}
      />
      {details && <p className="fr-stepper__details">{details}</p>}
      {/* L'avancement automatique change d'écran sans clic : le lecteur d'écran
          doit l'annoncer, sans quoi le changement passe inaperçu. */}
      <p className="fr-sr-only" aria-live="polite">
        Étape {part} sur {total}
      </p>
    </div>
  );
}
