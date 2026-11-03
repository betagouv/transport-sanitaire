// Un bouton qui agit sur un PDF, celui d'un cerfa comme celui de la feuille à
// remettre. Tant que le PDF se prépare, il attend, et « Télécharger » le dit,
// comme le bouton de l'éditeur (D-191). Le document quitté pendant qu'il se
// prépare se garde (`useShown`) : un PDF arrivé après coup n'en sort jamais
// (D-190).

import { type ReactNode, useEffect, useRef } from "react";

type Props = {
  className: string;
  icon?: ReactNode;
  /** Le PDF se prépare encore : le bouton attend. */
  waiting: boolean;
  /** En attendant, le bouton dit « Préparation du PDF » plutôt que son libellé. */
  saysPreparing?: boolean;
  onClick: () => void;
  children: string;
};

export function PdfActionButton({
  className,
  icon,
  waiting,
  saysPreparing = false,
  onClick,
  children,
}: Props) {
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={waiting}
    >
      {icon}
      {waiting && saysPreparing ? PREPARING : children}
    </button>
  );
}

// ---- implémentation ----

// Ce que dit « Télécharger » tant que le PDF se prépare.
const PREPARING = "Préparation du PDF";

/** Le document est-il encore affiché ? */
export function useShown() {
  const shown = useRef(false);
  useEffect(() => {
    shown.current = true;
    return () => {
      shown.current = false;
    };
  }, []);
  return shown;
}
