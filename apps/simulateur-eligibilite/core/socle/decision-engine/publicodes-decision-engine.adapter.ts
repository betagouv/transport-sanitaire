// Le moteur de décision par publicodes : des faits aux cibles, par les règles
// d'un modèle. C'est l'adaptateur du port `decision-engine.port.ts`.
//
// Le socle ne connaît ni les règles ni leurs noms : le modèle les lui donne.
// Le modèle le prend ici, hors du point d'entrée du socle, pour que
// publicodes reste hors du chunk d'entrée. Compiler le graphe de décision est
// l'autre travail confié à publicodes (`publicodes-graph-compiler.adapter.ts`).

import Engine, { type RawPublicodes } from "publicodes";
import { Cible } from "./cible.vo.ts";
import type { DecisionEngine } from "./decision-engine.port.ts";
import type { Fait } from "./fait/fait.vo.ts";

/** Les règles d'un modèle, par nom : les faits, puis les cibles. */
export type Rules = RawPublicodes<string>;

type AnyFaits = Readonly<Record<string, Fait<boolean | number | string>>>;

/** Le moteur de ces règles, qui calcule ces cibles. */
export class PublicodesDecisionEngine<
  Faits extends AnyFaits,
  Cibles extends Readonly<Record<string, Cible>>,
> implements DecisionEngine<Faits, Cibles>
{
  readonly #rules: Rules;
  readonly #cibles: readonly (keyof Cibles & string)[];
  // Compiler les règles coûte : le moteur est créé au premier calcul, puis gardé.
  #engine?: Engine;

  constructor(rules: Rules, cibles: readonly (keyof Cibles & string)[]) {
    this.#rules = rules;
    this.#cibles = cibles;
  }

  cibles(faits: Faits): Cibles {
    const evaluated = this.#on(faits);
    return Object.fromEntries(
      this.#cibles.map((cible) => [cible, cibleOf(evaluated, cible)]),
    ) as Cibles;
  }

  cible<Nom extends keyof Cibles>(faits: Faits, nom: Nom): Cibles[Nom] {
    return cibleOf(this.#on(faits), nom as string) as Cibles[Nom];
  }

  lazyCibles(faits: Faits): Cibles {
    return lazily(this.#cibles, (nom) => cibleOf(this.#on(faits), nom));
  }

  // Le moteur, sur la situation de ces faits.
  #on(faits: Faits): Engine {
    this.#engine ??= new Engine(this.#rules);
    this.#engine.setSituation(situationOf(faits));
    return this.#engine;
  }
}

// ---- implémentation ----

// Un objet dont chaque clé se calcule à sa première lecture, une seule fois.
function lazily<Values>(
  keys: readonly string[],
  compute: (key: string) => unknown,
): Values {
  const values = new Map<string, unknown>();
  const lazy = {};
  for (const key of keys) {
    Object.defineProperty(lazy, key, {
      enumerable: true,
      get: () => {
        if (!values.has(key)) values.set(key, compute(key));
        return values.get(key);
      },
    });
  }
  return lazy as Values;
}

// Une règle booléenne vaut `true` ou `false`, une règle à constantes l'une
// d'elles. `null` : elle ne s'applique pas. `undefined` : il manque un fait.
function cibleOf(engine: Engine, nom: string): Cible {
  return Cible.of(
    engine.evaluate(nom).nodeValue as boolean | string | null | undefined,
  );
}

// Seuls les faits établis partent aux règles : publicodes refuse une valeur
// `undefined`, et une clé absente laisse indéfini ce qui en dépend. Les règles
// lisent un booléen comme « oui » ou « non ».
function situationOf(faits: AnyFaits) {
  return Object.fromEntries(
    Object.entries(faits).flatMap(([fait, { value }]) =>
      value === undefined ? [] : [[fait, asRuleValue(value)]],
    ),
  );
}

function asRuleValue(value: boolean | number | string): string | number {
  if (typeof value !== "boolean") return value;
  return value ? "oui" : "non";
}
