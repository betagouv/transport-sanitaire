// Ce qu'ont en commun les actions qui attendent un PDF, celui d'un cerfa comme
// celui de la feuille à remettre : le libellé de l'attente, comme le bouton de
// l'éditeur (D-191), et la garde du document quitté pendant qu'il se prépare,
// d'où un PDF arrivé après coup ne sort jamais (D-190).

import { useEffect, useRef } from "react";

/** Ce que dit « Télécharger » tant que le PDF se prépare. */
export const PREPARING = "Préparation du PDF";

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
