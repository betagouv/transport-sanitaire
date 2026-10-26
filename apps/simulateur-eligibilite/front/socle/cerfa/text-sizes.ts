// Les tailles du texte écrit dans un cerfa, en points (D-68).
//
// Elles viennent du livrable de l'éditeur, et changent avec lui : une nouvelle
// version du modèle modifie ce fichier, pas le code qui les emploie.

export const TEXT_SIZES = {
  /** La taille visée : tout texte s'écrit à cette taille s'il y tient. */
  target: 9,
  /**
   * La taille réduite : un texte trop long pour son cadre y descend avant de
   * perdre son commentaire facultatif, puis rapetisse en dessous jusqu'à tenir
   * (D-85, D-193).
   */
  reduced: 8,
  /**
   * Le plancher d'un texte dessiné hors de son champ : un texte qui sortirait
   * de la page descend jusque-là, pas plus bas. Un texte écrit dans son champ,
   * lui, rapetisse sans plancher jusqu'à tenir (D-193).
   */
  floor: 6,
} as const;

/** Le pas d'un texte qui rapetisse sous la taille réduite, en points. */
export const SIZE_STEP = 0.5;
