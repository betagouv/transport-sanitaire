// Une réponse possible telle qu'elle se propose : sa valeur, son libellé du
// moment, et ce qu'elle porte de plus. Le modèle la déclare dans
// `question/declared/possible-answer.vo.ts`.

/**
 * L'aide d'une réponse possible : un intitulé qui se déplie sur une liste. La
 * déplier n'est pas répondre.
 */
export type PossibleAnswerHelp = {
  readonly label: string;
  readonly items: readonly string[];
};

/** La réponse possible ne se propose pas. */
export type NotOffered = undefined;

/**
 * Une réponse possible telle qu'elle se propose : sous son libellé et avec son
 * aide du moment. Elle ne porte que des données.
 */
export type OfferedPossibleAnswer = {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly blocks?: string;
  /** Son blocage propose de faire une nouvelle simulation. */
  readonly offersRestart?: true;
  readonly help?: PossibleAnswerHelp;
};
