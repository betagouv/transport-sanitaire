// Les cibles du modèle de démonstration : ce que sa préconisation calcule.

import type { Cible } from "../../../socle/index.ts";

export type Cibles = {
  /** La commande, en une phrase. « aucune » quand il n'y a rien à servir. */
  commande: Cible<string>;
  /**
   * Le lait tourne-t-il au contact du citron ? Inconnue tant qu'on ne sait pas
   * s'il y aura du citron. Ce n'est pas un « non ».
   */
  lait_tourne: Cible<boolean>;
};
