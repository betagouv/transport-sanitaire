// Ouvrir R2 ou R3 : un affichage de plus, où ses boutons seront exposés. Rien
// n'en part au journal.

import type { Journey, ResultScreen } from "./journey.entity";

export class OpenAResultScreen {
  execute(journey: Journey, screen: ResultScreen): void {
    journey.openAResultScreen(screen);
  }
}
