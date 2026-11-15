// Ce qu'une lecture lit : des questions, des faits, des cibles, et ce qu'elle ne
// lit que dans une branche (`onBranch`). C'est un objet valeur : il ne change
// pas, et ce que lisent deux valeurs se compose en un nouveau, chaque chose une
// fois.

/**
 * Ce qui ne compte que quand une cible vaut l'une de ces valeurs (#255). Ex. :
 * ce que lit la fiche positive ne compte que pour une issue positive.
 */
type Branch = {
  readonly cible: string;
  readonly values: readonly unknown[];
  readonly reads: Reads;
};

type Parts = {
  readonly questions?: readonly string[];
  readonly faits?: readonly string[];
  readonly cibles?: readonly string[];
  readonly branches?: readonly Branch[];
};

export class Reads {
  static readonly #none = new Reads({});

  /** Rien de lu. */
  static none(): Reads {
    return Reads.#none;
  }

  /** La réponse de cette question. */
  static ofQuestion(id: string): Reads {
    return new Reads({ questions: [id] });
  }

  /** Ce fait. */
  static ofFait(nom: string): Reads {
    return new Reads({ faits: [nom] });
  }

  /** Cette cible. */
  static ofCible(nom: string): Reads {
    return new Reads({ cibles: [nom] });
  }

  /**
   * La cible `cible`, et ce que lit `reads`, qui ne compte que quand elle vaut
   * l'une de `values`.
   */
  static onBranch(
    cible: string,
    values: readonly unknown[],
    reads: Reads,
  ): Reads {
    return new Reads({ cibles: [cible], branches: [{ cible, values, reads }] });
  }

  /** Ce que lisent toutes ces valeurs, chaque chose une fois. */
  static union(...all: readonly Reads[]): Reads {
    return all.reduce((union, reads) => union.with(reads), Reads.#none);
  }

  readonly questions: readonly string[];
  readonly faits: readonly string[];
  readonly cibles: readonly string[];
  readonly #branches: readonly Branch[];

  private constructor({
    questions = [],
    faits = [],
    cibles = [],
    branches = [],
  }: Parts) {
    this.questions = questions;
    this.faits = faits;
    this.cibles = cibles;
    this.#branches = branches;
    Object.freeze(this);
  }

  /** Ce qu'elle ne lit que dans une branche. */
  get branches(): readonly Branch[] {
    return this.#branches;
  }

  /** Ce que lisent celle-ci et celle-là, chaque chose une fois. */
  with(other: Reads): Reads {
    return new Reads({
      questions: union(this.questions, other.questions),
      faits: union(this.faits, other.faits),
      cibles: union(this.cibles, other.cibles),
      branches: [...this.#branches, ...other.#branches],
    });
  }

  /** Ce qu'elle lit hors de toute branche. */
  withoutBranches(): Reads {
    const { questions, faits, cibles } = this;
    return new Reads({ questions, faits, cibles });
  }

  /** Tout ce qu'elle lit, branches comprises, chaque chose une fois. */
  flattened(): Reads {
    const inBranches = this.#branches.map(({ reads }) => reads.flattened());
    return Reads.union(this.withoutBranches(), ...inBranches);
  }
}

// ---- implémentation ----

function union(a: readonly string[], b: readonly string[]): string[] {
  return [...new Set([...a, ...b])];
}
