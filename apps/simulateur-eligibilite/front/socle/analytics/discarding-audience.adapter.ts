// La mesure d'audience qui ne mesure rien : celle de l'écran quand Matomo n'est
// pas activé, en local comme dans les tests (`configFromEnv`).

import type { Audience } from "./audience.port";

export class DiscardingAudience implements Audience {
  track(): void {}
}
