// Le moteur de décision par publicodes : des faits aux cibles, par les règles
// d'un modèle. C'est l'adaptateur du port `decision-engine.port.ts`.
//
// Le socle ne connaît ni les règles ni leurs noms : le modèle les lui donne.
// Ce fichier est le seul du socle à importer publicodes. Le modèle le prend
// ici, hors du point d'entrée du socle, pour que publicodes reste hors du
// chunk d'entrée.

import Engine, { type RawPublicodes } from "publicodes";
import { Cible } from "./cible.ts";
import { compileDecisionGraph } from "./compile-the-decision-graph.ts";
import type { DecisionEngine } from "./decision-engine.port.ts";
import type { DecisionGraphData } from "./decision-graph/graph.ts";
import type { Fait } from "./fait/fait.ts";

/** Les règles d'un modèle, par nom : les faits, puis les cibles. */
export type Rules = RawPublicodes<string>;

type AnyFaits = Readonly<Record<string, Fait<boolean | number | string>>>;

/** Le moteur de ces règles, qui calcule ces cibles. */
export class PublicodesDecisionEngine<
  Faits extends AnyFaits,
  Cibles extends Readonly<Record<string, Cible>>,
> implements DecisionEngine<Faits, Cibles>
{
  readonly #evaluations: Evaluations;
  readonly #cibles: readonly (keyof Cibles & string)[];

  constructor(rules: Rules, cibles: readonly (keyof Cibles & string)[]) {
    this.#evaluations = new Evaluations(rules);
    this.#cibles = cibles;
  }

  cibles(faits: Faits): Cibles {
    return Object.fromEntries(
      this.#cibles.map((nom) => [nom, this.#evaluations.of(faits, nom)]),
    ) as Cibles;
  }

  cible<Nom extends keyof Cibles>(faits: Faits, nom: Nom): Cibles[Nom] {
    return this.#evaluations.of(faits, nom as string) as Cibles[Nom];
  }

  lazyCibles(faits: Faits): Cibles {
    return lazily(this.#cibles, (nom) => this.#evaluations.of(faits, nom));
  }
}

/**
 * Le graphe de décision de ces règles (#196). `pnpm regles` l'écrit à côté
 * d'elles : il se lit ensuite sans publicodes.
 */
export function decisionGraphOf(rules: Rules): DecisionGraphData {
  return compileDecisionGraph(new Engine(rules).getParsedRules());
}

// ---- implémentation ----

type Situation = ReturnType<typeof situationOf>;

// Ce que les règles donnent, cible par cible, pour chaque situation déjà vue.
// Une lecture du questionnaire redemande les mêmes cibles sur les mêmes faits,
// question après question : publicodes ne les recalcule pas.
class Evaluations {
  // Au-delà, tout est oublié : une session ne voit que quelques situations.
  static readonly #KEPT = 64;
  readonly #rules: Rules;
  readonly #known = new Map<string, Map<string, Cible>>();
  // Compiler les règles coûte : le moteur est créé au premier calcul, puis gardé.
  #engine: Engine | undefined;
  // La situation que le moteur porte : la changer efface ce qu'il a calculé.
  #current: string | undefined;

  constructor(rules: Rules) {
    this.#rules = rules;
  }

  of(faits: AnyFaits, nom: string): Cible {
    const situation = situationOf(faits);
    // Ce qui distingue ces faits d'autres, tels que publicodes les reçoit.
    const key = JSON.stringify(situation);
    const cibles = this.#ciblesOf(key);
    const known = cibles.get(nom);
    if (known) return known;
    const cible = cibleOf(this.#engineOn(situation, key), nom);
    cibles.set(nom, cible);
    return cible;
  }

  #ciblesOf(key: string): Map<string, Cible> {
    const known = this.#known.get(key);
    if (known) return known;
    if (this.#known.size >= Evaluations.#KEPT) this.#known.clear();
    const cibles = new Map<string, Cible>();
    this.#known.set(key, cibles);
    return cibles;
  }

  #engineOn(situation: Situation, key: string): Engine {
    this.#engine ??= new Engine(this.#rules);
    if (this.#current !== key) {
      this.#engine.setSituation(situation);
      this.#current = key;
    }
    return this.#engine;
  }
}

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
