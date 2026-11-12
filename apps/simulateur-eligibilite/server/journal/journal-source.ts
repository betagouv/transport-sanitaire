// Choisit le journal côté serveur : Grist si l'accès est configuré, sinon la
// mémoire.

import type { AccesGrist } from "../configuration.ts";
import { gristJournal } from "./grist-journal.ts";
import type { Journal } from "./journal.ts";
import { memoryJournal } from "./memory-journal.ts";

export function chooseJournal(grist: AccesGrist | undefined): Journal {
  return grist ? gristJournal(grist) : memoryJournal();
}
