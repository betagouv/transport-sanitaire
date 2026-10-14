// Les tailles du texte écrit dans un cerfa, en points (D-68).
//
// Elles viennent du livrable de l'éditeur, et changent avec lui : une nouvelle
// version du modèle modifie ce fichier, pas le code qui les emploie.

export const TEXT_SIZES = {
  /** La taille visée : tout texte s'écrit à cette taille s'il y tient. */
  target: 9,
  /** Le plancher : en dessous, un texte imprimé se lit mal. */
  floor: 6,
} as const;
