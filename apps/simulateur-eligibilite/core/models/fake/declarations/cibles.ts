// Les cibles du modèle de démonstration : ce que sa préconisation rend.

export type Cibles = {
  /** La commande, en une phrase. « aucune » quand il n'y a rien à servir. */
  commande: string;
  /**
   * Le lait tourne-t-il au contact du citron ? `undefined` : indéfinie, tant
   * qu'on ne sait pas s'il y aura du citron. Ce n'est pas un « non ».
   */
  lait_tourne: boolean | undefined;
};
