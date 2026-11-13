// Un motif du premier résultat (docs/knowledge/CONTEXT.md, « Motif ») : une
// raison que R2 affiche, telle que le catalogue de l'éditeur l'écrit. Le
// calcul qui choisit son texte choisit aussi son identifiant, que reçoit le
// journal des parcours (ADR-9 de docs/knowledge/adr/analytics.md).

/** Un motif affiché : son identifiant au catalogue. */
export type Motif = { readonly id: string };

/**
 * Le motif d'une entrée du catalogue, sans son texte : celui-ci garde ses
 * repères, que seul le lexique remplit.
 */
export function motifDe({ id }: Motif): Motif {
  return { id };
}

/** Les identifiants de ces motifs, dans l'ordre où R2 les affiche. */
export function identifiantsDes(motifs: readonly Motif[]): string[] {
  return motifs.map(({ id }) => id);
}
