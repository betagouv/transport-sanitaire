// Les cibles du modèle de démonstration : ce que sa préconisation rend.

export type Cibles = {
  /** La commande, en une phrase. « aucune » quand il n'y a rien à servir. */
  commande: string;
  /**
   * Le lait tourne-t-il au contact du citron ? `undefined` : indéfinie, faute
   * de savoir s'il y a du lait ou du citron. Ce n'est pas un « non ».
   */
  lait_tourne: boolean | undefined;
};
