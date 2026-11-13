// Une version de la fiche patient (ADR-11) : `f1`, `f2`… dans une simulation,
// une par révision qui en montre une. La fiche ne vient que du premier
// résultat : ce qui la changerait fait tomber sa révision.

import type { Revision } from "./revision.entity";

export class SheetVersion {
  readonly id: string;
  readonly #rank: number;
  readonly #revision: Revision;

  private constructor(rank: number, revision: Revision) {
    this.#rank = rank;
    this.#revision = revision;
    this.id = `f${rank}`;
  }

  /** La première version d'une simulation. */
  static first(revision: Revision): SheetVersion {
    return new SheetVersion(1, revision);
  }

  /** La fiche de cette révision. */
  of(revision: Revision): boolean {
    return this.#revision === revision;
  }

  /** La version qui la remplace, pour une autre révision. */
  next(revision: Revision): SheetVersion {
    return new SheetVersion(this.#rank + 1, revision);
  }
}
