// Le stepper du simulateur : « Étape n sur N ». Il compte des parties, jamais
// des pages. Son titre est celui de la partie, ou du résultat. Une ligne sous
// la barre dit ce qui suit. Sur une page de questions, rien d'autre ne titre
// l'écran : son titre est le `h1`. Un résultat a le sien, le stepper passe en
// `h2`.

import type { ReactNode } from "react";

type Props = {
  part: number;
  total: number;
  title?: string;
  /** Le niveau du titre. `1` quand le stepper titre l'écran. */
  level?: 1 | 2;
  details?: ReactNode;
};

export function Stepper({ part, total, title, level = 2, details }: Props) {
  const Title = level === 1 ? "h1" : "h2";
  return (
    <div className="fr-stepper" style={{ marginBottom: "2rem" }}>
      <Title className="fr-stepper__title">
        {title && `${title} `}
        <span className="fr-stepper__state">
          Étape {part} sur {total}
        </span>
      </Title>
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

/** La ligne sous la barre qui annonce l'étape suivante. */
export function NextStep({ label }: { label: string }) {
  return (
    <>
      <span className="fr-text--bold">Étape suivante :</span> {label}
    </>
  );
}
