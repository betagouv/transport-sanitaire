// Retirer le document R3 prêt : il passe en édition ou en aperçu, se génère de
// nouveau, ou l'écran se quitte. Ses boutons ne sont plus exposés : un clic
// n'en part plus, et le document de nouveau prêt les expose à nouveau. Rien ne
// part au journal.

import type { Journey } from "./journey.entity";

export class WithdrawADocument {
  execute(journey: Journey): void {
    journey.withdrawButtons("R3");
  }
}
