// Le chargement du premier résultat : le modèle peut donner son contenu tout
// de suite, ou le promettre. La promesse se garde par modèle et par réponses
// ; l'écran la lit dans un état (`first-result.hook.ts`).

import type { Answers } from "../../../../core/socle/questionnaire-engine";
import type { Simulation } from "../../../../core/socle/simulation";
import type { FirstResult, Model } from "../../model.types";

export type Loading = FirstResult | Promise<FirstResult>;

export class FirstResultService {
  // La promesse d'un résultat qui charge, par modèle puis par réponses. Gardée
  // hors de React : chaque rendu de la page relancerait le chargement.
  static readonly #loading = new WeakMap<
    Model,
    WeakMap<Answers, Promise<FirstResult>>
  >();

  readonly #model: Model;

  constructor(model: Model) {
    this.#model = model;
  }

  /** Le premier résultat de cette simulation, ou la promesse de son chargement. */
  of(simulation: Simulation): Loading {
    const model = this.#model;
    const { answers } = simulation;
    const known = FirstResultService.#loading.get(model)?.get(answers);
    if (known) return known;
    const reading = model.core.result.reading.in(
      simulation.resultContext(new Date()),
    );
    const result = model.result.content({ reading });
    if (!(result instanceof Promise)) return result;
    const byAnswers = FirstResultService.#loading.get(model) ?? new WeakMap();
    FirstResultService.#loading.set(model, byAnswers.set(answers, result));
    return result;
  }
}
