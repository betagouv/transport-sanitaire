// Le titre d'une issue : `court : long`, précédé du nom court de ses parentes.
// `v10 - Chantier 07 - Écrire les seeds` se lit seul, hors de son arbre.

/** Le titre d'une tâche, avec le chemin de sa parente devant. */
export function withPath(parentTitle: string, title: string): string {
  const prefix = prefixFrom(parentTitle);
  return title.startsWith(prefix) ? title : `${prefix}${title}`;
}

/** Le titre sans le chemin de sa parente : un arbre le montre déjà. */
export function withoutPath(parentTitle: string, title: string): string {
  const prefix = prefixFrom(parentTitle);
  return title.startsWith(prefix) ? title.slice(prefix.length) : title;
}

// ---- implémentation ----

/** `v10 - Chantier 07 : Seeds` donne `v10 - Chantier 07 - `. */
function prefixFrom(parentTitle: string): string {
  return `${parentTitle.split(" : ")[0]} - `;
}
