// Les faits du modèle de démonstration : ce que ses règles reçoivent, et
// l'ordre où ils se lisent.

import type { Fait } from "../../../socle/index.ts";

export type Faits = {
  /** La boisson commandée, en toutes lettres. `null` : aucune. */
  boisson: string | null;
  /** Ce qui l'accompagne, en toutes lettres. */
  accompagnements: readonly string[];
  /** Du lait est demandé. */
  lait: Fait;
  /**
   * Du citron est demandé. « Non » avec un café, où il ne se sert pas. Absent
   * quand on ne le saura qu'au service.
   */
  citron: Fait;
};

/** Le nom de chaque fait, dans l'ordre où ils se lisent. */
export const FAITS = [
  "boisson",
  "accompagnements",
  "lait",
  "citron",
] as const satisfies readonly (keyof Faits)[];
