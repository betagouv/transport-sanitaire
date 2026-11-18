// Ce que la lecture du journal attend d'un stockage : les entrées dans l'ordre
// où elles sont arrivées, page par page. Un curseur, et pas un numéro de page :
// le journal grossit pendant qu'on le lit, et un numéro sauterait ou
// doublerait des entrées. PostgreSQL et la mémoire y répondent.

import type { JournalEntry } from "./journal-entry.entity.ts";

/** Où reprendre la lecture : opaque pour qui lit. */
export type Cursor = string;

/** Pas de curseur : la lecture part du début du journal. */
export type FromTheStart = undefined;

/** Pas de page suivante, pour l'instant : le journal n'a rien de plus. */
type LastPage = null;

export type JournalPage = { entries: JournalEntry[]; next: Cursor | LastPage };

export interface JournalPages {
  /** Au plus `size` entrées, arrivées après le curseur. */
  pageAfter(after: Cursor | FromTheStart, size: number): Promise<JournalPage>;
}
