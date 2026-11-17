// Le compteur d'un texte saisi (#480) : « 12 / 54 caractères » sous le champ,
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

/** Ce que le compteur ajoute au champ : son texte, et ses erreurs. */
export function counted(
  counterOf: CounterOf | undefined,
  question: string,
  answer: Answer | Unanswered,
): { readonly text?: string; readonly errors: readonly string[] } {
  const counter = counterOf?.(
    question,
    typeof answer === "string" ? answer : "",
  );
  return { text: counter?.text, errors: counter?.error ? [counter.error] : [] };
}
