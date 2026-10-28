// Le catalogue des faits d'un modèle : la liste de ses faits, chacun déclaré
// une fois (`fait-builder.ts`). Chaque fait lit les questions validées et, au
// besoin, d'autres faits.
//
// Le catalogue refuse un fait déclaré deux fois, oublié, ou qui n'est pas du
// modèle. Il calcule chaque fait à sa première lecture : une garde qui lit deux
// faits n'en calcule que deux. Un fait qui se lit lui-même, par d'autres faits
// ou par une garde, s'arrête net.

import { validatedReading } from "../questionnaire-engine/answer-readings.ts";
import {
  NOTHING,
  type Reading,
  type Reads,
  readsOf,
} from "../questionnaire-engine/condition.ts";
import type { ValidatedAnswers } from "../questionnaire-engine/validated-answers.ts";
import type { FaitDeclare } from "./fait-builder.ts";

/** Les faits d'un modèle, chacun sous son nom et avec sa valeur. */
export type FaitsDeclares<Faits> = readonly {
  readonly [Nom in keyof Faits & string]: FaitDeclare<Nom, Faits[Nom]>;
}[keyof Faits & string][];

/** Les faits d'un modèle, chacun déclaré une fois. */
export class FaitCatalogue<Faits extends object> {
  readonly #names: readonly (keyof Faits & string)[];
  readonly #declares: ReadonlyMap<string, FaitDeclare<string, unknown>>;

  /**
   * `names` : tous les faits du modèle, dans l'ordre où ils se lisent. Chacun
   * se déclare une fois dans `declares`.
   */
  constructor(
    names: readonly (keyof Faits & string)[],
    declares: FaitsDeclares<Faits>,
  ) {
    this.#names = names;
    this.#declares = indexed(names, declares);
  }

  /** Ce que lit chaque fait : des questions et d'autres faits, dans l'ordre du modèle. */
  get reads(): ReadonlyMap<keyof Faits & string, Reads> {
    return this.readsWith({});
  }

  /**
   * Ce que lit chaque fait, avec ce que lisent ceux qu'impose la décision
   * (`imposed`) : le catalogue ne les calcule pas, mais ils lisent des
   * questions.
   */
  readsWith(
    imposed: Partial<Record<keyof Faits & string, Reads>>,
  ): ReadonlyMap<keyof Faits & string, Reads> {
    return new Map(
      this.#names.map((name) => [
        name,
        readsOf(
          this.#declares.get(name)?.reads ?? NOTHING,
          imposed[name] ?? NOTHING,
        ),
      ]),
    );
  }

  /**
   * Les faits de ces questions validées, calculés à la lecture. `fixed` : des
   * faits imposés, qui ne se calculent pas.
   */
  read(validated: ValidatedAnswers, fixed: Partial<Faits> = {}): Faits {
    const faits = {} as Faits;
    const reading = factReading(validated, faits);
    const known = new Map<string, unknown>(Object.entries(fixed));
    for (const name of this.#names) {
      const declare = this.#declares.get(name) as FaitDeclare<string, unknown>;
      Object.defineProperty(faits, name, {
        enumerable: true,
        get: () => {
          if (!known.has(name)) known.set(name, computed(declare, reading));
          return known.get(name);
        },
      });
    }
    return Object.freeze(faits);
  }
}

// ---- implémentation ----

function indexed(
  names: readonly string[],
  declares: readonly FaitDeclare<string, unknown>[],
): ReadonlyMap<string, FaitDeclare<string, unknown>> {
  const all = new Map<string, FaitDeclare<string, unknown>>();
  for (const declare of declares) {
    if (!names.includes(declare.nom))
      throw new Error(`« ${declare.nom} » n'est pas un fait du modèle.`);
    if (all.has(declare.nom))
      throw new Error(`« ${declare.nom} » se déclare deux fois.`);
    all.set(declare.nom, declare);
  }
  const missing = names.filter((name) => !all.has(name));
  if (missing.length > 0)
    throw new Error(`Ces faits ne sont pas déclarés : ${missing.join(", ")}.`);
  return all;
}

// Un fait lit les questions validées et les autres faits. Il ne lit ni cible
// ni jour.
function factReading(validated: ValidatedAnswers, faits: object): Reading {
  const refused = (what: string) => () => {
    throw new Error(`Un fait ne lit pas ${what}.`);
  };
  return {
    answer: validatedReading(validated),
    fait: (nom) => (faits as Readonly<Record<string, unknown>>)[nom],
    cible: refused("de cible"),
    cibleAssuming: refused("de cible"),
    today: refused("le jour"),
  };
}

// Les faits en cours de calcul, toutes lectures confondues. Un fait qui s'y
// trouve déjà se lit lui-même : il bouclerait.
const computing: string[] = [];

function computed(declare: FaitDeclare<string, unknown>, reading: Reading) {
  if (computing.includes(declare.nom))
    throw new Error(
      `« ${declare.nom} » se lit lui-même : ${[...computing, declare.nom].join(" → ")}.`,
    );
  computing.push(declare.nom);
  try {
    return declare.in(reading);
  } finally {
    computing.pop();
  }
}
