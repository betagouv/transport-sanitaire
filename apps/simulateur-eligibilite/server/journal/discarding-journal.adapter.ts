// Le journal qui ne garde rien : celui du serveur sans doc Grist, en staging
// comme en développement. Il accepte chaque événement et l'oublie aussitôt, pour
// que la mémoire du serveur ne grossisse pas avec le trafic.

import type { Journal, NotInTheJournal } from "./journal.port.ts";

export class DiscardingJournal implements Journal {
  async find(): Promise<NotInTheJournal> {
    return undefined;
  }

  async append(): Promise<void> {}

  async setAside(): Promise<void> {}
}
