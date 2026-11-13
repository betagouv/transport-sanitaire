// Le chargement du premier résultat : le modèle peut donner son contenu tout
// de suite, ou le promettre. La promesse se garde par modèle et par réponses,
// et l'écran la lit dans un état.

import { useEffect, useState } from "react";
import type { Answers } from "../../../../core/socle/questionnaire-engine";
import type { Simulation } from "../../../../core/socle/simulation";
import type { FirstResult, Model } from "../../model";

export type Loading = FirstResult | Promise<FirstResult>;

// La promesse d'un résultat qui charge, par modèle puis par réponses. Gardée
// hors de React : chaque rendu de la page relancerait le chargement.
const loading = new WeakMap<Model, WeakMap<Answers, Promise<FirstResult>>>();

export function resultOf(model: Model, simulation: Simulation): Loading {
  const { answers } = simulation;
  const known = loading.get(model)?.get(answers);
  if (known) return known;
  const reading = simulation.read(new Date())(model.result.reading);
  const result = model.result.content({ reading });
  if (!(result instanceof Promise)) return result;
  const byAnswers = loading.get(model) ?? new WeakMap();
  loading.set(model, byAnswers.set(answers, result));
  return result;
}

// Un état plutôt que `use()` : une suspension née dans un `act` synchrone, celui
// d'un clic sous les tests, ne reprend jamais.
export function useLoaded(result: Loading): FirstResult | null {
  const [loaded, setLoaded] = useState<{ from: Loading; value: FirstResult }>();
  useEffect(() => {
    if (!(result instanceof Promise)) return;
    let live = true;
    result.then((value) => live && setLoaded({ from: result, value }));
    return () => {
      live = false;
    };
  }, [result]);
  if (!(result instanceof Promise)) return result;
  return loaded?.from === result ? loaded.value : null;
}
