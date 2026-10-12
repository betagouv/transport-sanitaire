// Le choix du modèle : l'app déroule le sien, et les developer tools proposent
// d'en dérouler un autre à sa place, parmi ceux que `Main` lui donne.
//
// Un autre modèle ne se charge que si on l'ouvre. Le choix ne survit pas au
// rechargement de la page : l'app ne garde rien entre deux chargements.

import { useState } from "react";
import type { ModelSource } from "./model-loading";

/** Un modèle que l'app peut dérouler à la place du sien. */
export type OtherModel = {
  /** Le nom du bouton qui l'ouvre. Il distingue ce modèle des autres. */
  label: string;
  /** Ce qui le charge, appelé à son ouverture. */
  load: () => ModelSource;
};

/** La bascule d'un autre modèle : son nom, s'il est ouvert, et de quoi en changer. */
export type ModelToggle = {
  label: string;
  active: boolean;
  toggle: () => void;
};

export type ModelChoice = {
  /** Le modèle à dérouler : celui de l'app, ou l'autre quand il est ouvert. */
  source: ModelSource;
  /** Une bascule par autre modèle. Aucune quand l'app n'en a pas. */
  toggles: ModelToggle[];
};

export function useModelChoice(
  initial: ModelSource,
  others: OtherModel[] = [],
): ModelChoice {
  const [opened, setOpened] = useState<Opened | null>(null);
  return {
    source: opened ? opened.source : initial,
    toggles: others.map(({ label, load }) => {
      const active = opened?.label === label;
      return {
        label,
        active,
        toggle: () => setOpened(active ? null : { label, source: load() }),
      };
    }),
  };
}

// ---- implémentation ----

type Opened = { label: string; source: ModelSource };
