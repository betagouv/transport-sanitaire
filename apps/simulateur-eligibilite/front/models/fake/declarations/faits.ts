// Les faits du modèle de démonstration : ce que ses règles reçoivent.

import type { Fait } from "../../../socle/decision-engine/publicodes";

export type Faits = {
  /** La boisson commandée, en toutes lettres. `null` : aucune. */
  boisson: string | null;
  /** Ce qui l'accompagne, en toutes lettres. */
  accompagnements: readonly string[];
  /** Du lait est demandé. Absent tant que les accompagnements n'ont pas été demandés. */
  lait: Fait;
  /** Du citron est demandé. Absent aussi quand il ne s'est pas proposé. */
  citron: Fait;
};
