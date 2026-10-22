// Ce qui ne va pas dans une saisie, dit par sa nature. L'écran en écrit le
// message (`front/socle/questionnaire-engine/screen-texts.ts`). Les phrases
// livrées par l'éditeur (un blocage, une incompatibilité, une incohérence)
// restent ici, telles quelles : une API doit pouvoir les donner.
//
// Chaque sorte de question dit les siens (`asked-question.ts`).

/** Ce qui ne va pas dans une saisie. */
export type AnswerProblem =
  | { readonly kind: "missing" }
  | { readonly kind: "nothing checked" }
  | { readonly kind: "not a number" }
  | { readonly kind: "not an integer" }
  | { readonly kind: "number below"; readonly min: number }
  | { readonly kind: "number above"; readonly max: number }
  /** Les bornes d'une date s'écrivent au format ISO, comme la réponse. */
  | { readonly kind: "date before"; readonly min: string }
  | { readonly kind: "date after"; readonly max: string }
  | { readonly kind: "invalid postal code" }
  /** Une phrase de l'éditeur : un blocage, une incompatibilité, une incohérence. */
  | { readonly kind: "stated"; readonly text: string };

/** Une réponse attendue manque. */
export const MISSING: AnswerProblem = { kind: "missing" };

/** Une phrase de l'éditeur, telle qu'il l'a écrite. */
export function stated(text: string): AnswerProblem {
  return { kind: "stated", text };
}
