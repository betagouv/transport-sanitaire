// Le modèle de démonstration : un second modèle, que les developer tools
// proposent de dérouler à la place du modèle livré. Chaque capacité du socle
// s'y valide à l'écran.
//
// Il ne se charge que si on le demande. Le choix ne survit pas au rechargement
// de la page : l'app ne garde rien entre deux chargements.

import { useState } from "react";
import type { ModelSource } from "./model-loading";

/** Ce qui charge le modèle de démonstration, appelé à son ouverture. */
export type DemonstrationSource = () => ModelSource;

/** L'état de la démonstration, et de quoi y entrer ou en sortir. */
export type Demonstration = { active: boolean; toggle: () => void };

export type ModelChoice = {
  /** Le modèle à dérouler : le livré, ou celui de démonstration. */
  source: ModelSource;
  /** Absent quand l'app n'a pas de modèle de démonstration. */
  demonstration?: Demonstration;
};

export function useModelChoice(
  delivered: ModelSource,
  demonstration?: DemonstrationSource,
): ModelChoice {
  const [opened, setOpened] = useState<{ source: ModelSource } | null>(null);
  if (!demonstration) return { source: delivered };
  return {
    source: opened ? opened.source : delivered,
    demonstration: {
      active: opened !== null,
      toggle: () => setOpened(opened ? null : { source: demonstration() }),
    },
  };
}
