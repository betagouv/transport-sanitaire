// Une option telle qu'elle se propose : sa valeur, son libellé du moment, et ce
// qu'elle porte de plus. Le modèle la déclare dans `declared-option.ts`.

/**
 * L'aide d'une option : un intitulé qui se déplie sur une liste. La déplier
 * n'est pas répondre.
 */
export type OptionHelp = {
  readonly label: string;
  readonly items: readonly string[];
};

/**
 * Une option telle qu'elle se propose : sous son libellé et avec son aide du
 * moment. Elle ne porte que des données.
 */
export type OfferedOption = {
  readonly value: string;
  readonly label: string;
  readonly description?: string;
  readonly blocks?: string;
  readonly help?: OptionHelp;
};
