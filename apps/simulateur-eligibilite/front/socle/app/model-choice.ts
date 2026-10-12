// Le choix du modèle : l'app déroule le premier de ses modèles. Quand `Main`
// lui en donne plusieurs, les developer tools proposent d'en changer.
//
// Un modèle ne se charge que quand il s'ouvre. Le choix ne survit pas au
// rechargement de la page : l'app ne garde rien entre deux chargements.

import { useState } from "react";
import type { ModelSource } from "./model-loading";

/** Un modèle que l'app peut dérouler. */
type NamedModel = {
  /** Le nom sous lequel il se choisit. Il le distingue des autres. */
  label: string;
  /** Ce qui le charge, appelé à son ouverture. */
  load: () => ModelSource;
};

/** Les modèles de l'app : au moins un. Le premier s'ouvre au démarrage. */
export type Models = readonly [NamedModel, ...NamedModel[]];

/** Un modèle à choisir : son nom, s'il est ouvert, et de quoi l'ouvrir. */
export type ModelChoice = {
  label: string;
  active: boolean;
  choose: () => void;
};

export type OpenedModel = {
  /** Le modèle à dérouler. */
  source: ModelSource;
  /** Un choix par modèle. Aucun quand l'app n'en a qu'un. */
  choices: ModelChoice[];
};

export function useModelChoice(models: Models): OpenedModel {
  const [opened, setOpened] = useState(() => open(models[0]));
  if (models.length === 1) return { source: opened.source, choices: [] };
  return {
    source: opened.source,
    choices: models.map((model) => ({
      label: model.label,
      active: model.label === opened.label,
      choose: () => setOpened(open(model)),
    })),
  };
}

// ---- implémentation ----

function open({ label, load }: NamedModel) {
  return { label, source: load() };
}
