// Une révision du document R3 (R13, contrat v10.2.2) : `dr1`, `dr2`… dans une
// simulation. Elle naît sous une révision du R2, et une page de P3 validée qui
// change les réponses la remplace. Ses versions, `d1`, `d2`…, changent dès que
// le PDF change ; elle, seulement quand le complément change.

import type { Revision } from "./revision.entity";

export class DocumentRevision {
  readonly id: string;
  readonly #rank: number;
  readonly #revision: Revision;

  private constructor(rank: number, revision: Revision) {
    this.#rank = rank;
    this.#revision = revision;
    this.id = `dr${rank}`;
  }

  /** La première révision du document d'une simulation. */
  static first(revision: Revision): DocumentRevision {
    return new DocumentRevision(1, revision);
  }

  /** Elle vient de cette révision du R2. */
  of(revision: Revision): boolean {
    return this.#revision === revision;
  }

  /** La révision qui la remplace, sous cette révision du R2. */
  next(revision: Revision): DocumentRevision {
    return new DocumentRevision(this.#rank + 1, revision);
  }
}
