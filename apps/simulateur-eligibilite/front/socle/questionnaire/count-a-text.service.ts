// Le compteur d'un texte saisi : « 12 / 54 caractères » sous le champ,
// et l'erreur qui l'accompagne quand le texte ne tient pas là où il s'écrit.
// Il prévient : la page se valide quand même. Qui l'affiche dit comment il
// compte (`QuestionnaireForm`, `counterOf`).

import type {
  Answer,
  Unanswered,
} from "../../../core/socle/questionnaire-engine";

/** La question n'a pas de compteur. */
type NoCounter = undefined;

/** Le compteur d'une question, pour sa saisie. */
export type CounterOf = (
  question: string,
  text: string,
) => { readonly text: string; readonly error?: string } | NoCounter;

/** Le compteur d'une page, s'il y en a un, et ce qu'il ajoute aux champs. */
export class CountATextService {
  readonly #counterOf: CounterOf | undefined;

  constructor(counterOf: CounterOf | undefined) {
    this.#counterOf = counterOf;
  }

  /** Ce que le compteur ajoute au champ : son texte, et ses erreurs. */
  of(
    question: string,
    answer: Answer | Unanswered,
  ): { readonly text?: string; readonly errors: readonly string[] } {
    const counter = this.#counterOf?.(
      question,
      typeof answer === "string" ? answer : "",
    );
    return {
      text: counter?.text,
      errors: counter?.error ? [counter.error] : [],
    };
  }
}
