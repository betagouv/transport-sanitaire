// Les blancs en trop du catalogue : une espace laissée par un terme vide du
// lexique, ou des sauts de ligne au milieu d'un « Pourquoi ». Ils ne disent
// rien : chaque suite de blancs vaut une espace, et le texte n'en garde ni
// devant ni derrière.

/** Le texte, chaque suite de blancs réduite à une espace, sans blanc autour. */
export function sansBlancsDeTrop(texte: string): string {
  return texte.replace(/\s+/g, " ").trim();
}
