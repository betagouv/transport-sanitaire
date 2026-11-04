// Un bouton secondaire du DSFR : « Précédent », « Faire une nouvelle
// simulation », sous un résultat.

import type { ReactNode } from "react";

type Props = { onClick: () => void; children: ReactNode };

export function SecondaryButton({ onClick, children }: Props) {
  return (
    <button
      type="button"
      className="fr-btn fr-btn--secondary"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
