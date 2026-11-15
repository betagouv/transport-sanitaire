// Les incohérences qu'une question déclare (`inconsistentWhen`) : chacune a sa
// condition, le message qui dit quoi corriger, et les réponses d'avant qu'elle
// invite à revoir. Elles lisent les questions d'avant et celle-ci : le socle
// vérifie ce qu'elles lisent (`conditions/guard-reading.service.ts`), et le
// graphe s'en sert (`does-a-question-still-matter/`).

import type {
  Condition,
  Context,
  Reading,
  Text,
} from "../../conditions/reading.vo.ts";
import { Reads } from "../../conditions/reads.vo.ts";
import type { Revisit } from "../asked/common.vo.ts";

/** Une incohérence, telle que `inconsistentWhen` la déclare. */
export type Inconsistency = {
  readonly condition: Condition;
  readonly message: Text;
  readonly revisit?: Reading<readonly Revisit[]>;
};

/** Ce que disent les incohérences qui tiennent. */
type Stated = {
  readonly messages: readonly string[];
  /** Chaque réponse à revoir une fois, dans l'ordre des incohérences. */
  readonly revisits: readonly Revisit[];
};

/** Les incohérences d'une question, dans l'ordre où elle les déclare. */
export class Inconsistencies {
  static none(): Inconsistencies {
    return new Inconsistencies([]);
  }

  readonly #all: readonly Inconsistency[];

  private constructor(all: readonly Inconsistency[]) {
    this.#all = all;
    Object.freeze(this);
  }

  /** Les mêmes, avec celle-ci en plus. */
  with(inconsistency: Inconsistency): Inconsistencies {
    return new Inconsistencies([...this.#all, inconsistency]);
  }

  /** Celles qui tiennent vu ces réponses : leurs messages, et quoi revoir. */
  in(earlier: Context): Stated {
    const holding = this.#all.filter(({ condition }) => condition.in(earlier));
    const revisits = holding.flatMap(
      ({ revisit }) => revisit?.in(earlier) ?? [],
    );
    return {
      messages: holding.map(({ message }) =>
        typeof message === "string" ? message : message.in(earlier),
      ),
      revisits: revisits.filter(
        ({ question }, index) =>
          revisits.findIndex((other) => other.question === question) === index,
      ),
    };
  }

  /** Ce qu'elles lisent, leurs réponses à revoir comprises. */
  get guards(): readonly Reading<unknown>[] {
    return this.#all.flatMap(({ condition, revisit }) =>
      revisit ? [condition, revisit] : [condition],
    );
  }

  /** Ce qu'elles lisent, réuni. `null` : la question n'en a pas. */
  get reads(): Reads | null {
    if (this.#all.length === 0) return null;
    return Reads.union(...this.guards.map(({ reads }) => reads));
  }
}
