// Un motif du premier résultat (docs/knowledge/CONTEXT.md, « Motif ») : une
// raison que R2 affiche, telle que le catalogue de l'éditeur l'écrit. Le
// calcul qui choisit son texte choisit aussi son identifiant.

/** Un motif affiché : son identifiant au catalogue. */
export type Motif = { readonly id: string };

/**
 * Le motif d'une entrée du catalogue, sans son texte : celui-ci garde ses
 * repères, que seul le lexique remplit.
 */
export function motifDe({ id }: Motif): Motif {
  return { id };
}
