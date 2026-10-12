// Le modèle que l'app déroule, qu'il soit déjà là ou qu'il se charge à la
// demande. Le contrat `Model` reste synchrone : seule son arrivée attend.

import { useEffect, useState } from "react";
import type { Model } from "../model";

/** Un modèle, ou sa promesse quand il se charge à la demande. */
export type ModelSource = Model | Promise<Model>;

/** Où en est le chargement. Sans modèle ni échec : il est en cours. */
export type ModelLoading = { model?: Model; failed: boolean };

export function useModelLoading(source: ModelSource): ModelLoading {
  const [arrival, setArrival] = useState<Arrival>();

  useEffect(() => {
    if (!(source instanceof Promise)) return;
    let current = true;
    source.then(
      (model) => current && setArrival({ source, model, failed: false }),
      () => current && setArrival({ source, failed: true }),
    );
    return () => {
      current = false;
    };
  }, [source]);

  if (!(source instanceof Promise)) return { model: source, failed: false };
  // Une arrivée ne vaut que pour sa source : quand l'app change de modèle, le
  // précédent ne doit pas rester à l'écran le temps que le suivant arrive.
  return arrival?.source === source ? arrival : { failed: false };
}

// ---- implémentation ----

type Arrival = ModelLoading & { source: Promise<Model> };
