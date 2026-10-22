// Les cibles du modèle factice : ce que sa préconisation calcule.

import type { Cible } from "../../../../../core/socle";

export type Cibles = {
  /** La commande, en une phrase. « aucune » quand il n'y a rien à servir. */
  commande: Cible<string>;
};
