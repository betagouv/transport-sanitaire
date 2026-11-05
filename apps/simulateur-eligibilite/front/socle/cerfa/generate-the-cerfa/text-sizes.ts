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
   * (D-85, D-193). C'est aussi la taille d'un texte dessiné hors de son champ.
   */
  reduced: 8,
  /**
   * Le plancher de lisibilité, celui du contrat des adresses (CERFA-ADR). Un
   * texte qui ne tient pas dans son champ au plancher se dessine plutôt sous
   * son cadre, à la plus grande taille jusqu'ici où il en reste près ; sinon
   * il descend sous le plancher (#341). Un texte trop long pour le nombre de
   * caractères de son champ ne descend jusqu'ici que s'il sortirait de la page.
   */
  floor: 6,
} as const;

/** Le pas d'un texte qui rapetisse sous la taille réduite, en points. */
export const SIZE_STEP = 0.5;
