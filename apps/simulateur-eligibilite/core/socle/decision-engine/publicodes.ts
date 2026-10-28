// Le moteur de décision : des faits aux cibles, par les règles publicodes d'un
// modèle.
//
// Le socle ne connaît ni les règles ni leurs noms : le modèle les lui donne.
// Ce fichier est le seul du socle à importer publicodes. Le modèle le prend
// ici, hors du point d'entrée du socle, pour que publicodes reste hors du
// chunk d'entrée.

import Engine, { type RawPublicodes } from "publicodes";
import { Cible } from "./cible.ts";
import type { DecisionGraphData } from "./decision-graph.ts";
import { compileDecisionGraph } from "./decision-graph-compiler.ts";
import type { Fait } from "./fait.ts";

/** Les règles d'un modèle, par nom : les faits, puis les cibles. */
export type Rules = RawPublicodes<string>;

/**
 * Ce que des règles calculent pour des faits. Chaque cible peut rester
 * inconnue, faute d'un fait dont elle dépend : ce n'est pas une décision.
 */
export type DecisionEngine<Faits, Cibles> = {
  /** Toutes les cibles de ces faits : la préconisation. */
  cibles(faits: Faits): Cibles;
  /** Une seule cible de ces faits, quand le questionnaire en a besoin en route. */
  cible<Nom extends keyof Cibles>(faits: Faits, nom: Nom): Cibles[Nom];
  /**
   * Les cibles de ces faits, chacune calculée à sa première lecture : celles
   * qu'une garde lit en route, sans payer les autres.
   */
  lazyCibles(faits: Faits): Cibles;
};

/** Le moteur de ces règles, qui calcule ces cibles. */
export function publicodesEngine<
  Faits extends Readonly<Record<string, Fait<boolean | number | string>>>,
  Cibles extends Readonly<Record<string, Cible>>,
>(
  rules: Rules,
  cibles: readonly (keyof Cibles & string)[],
): DecisionEngine<Faits, Cibles> {
  // Compiler les règles coûte : le moteur est créé au premier calcul, puis gardé.
  let engine: Engine | undefined;
  const on = (faits: Faits) => {
    engine ??= new Engine(rules);
    engine.setSituation(situationOf(faits));
    return engine;
  };
  return {
    cibles: (faits) => {
      const evaluated = on(faits);
      return Object.fromEntries(
        cibles.map((cible) => [cible, cibleOf(evaluated, cible)]),
      ) as Cibles;
    },
    cible: (faits, nom) =>
      cibleOf(on(faits), nom as string) as Cibles[typeof nom],
    lazyCibles: (faits) => lazily(cibles, (nom) => cibleOf(on(faits), nom)),
  };
}

/**
 * Le graphe de décision de ces règles (#196). `pnpm regles` l'écrit à côté
 * d'elles : il se lit ensuite sans publicodes.
 */
export function decisionGraphOf(rules: Rules): DecisionGraphData {
  return compileDecisionGraph(new Engine(rules).getParsedRules());
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
function situationOf(
  faits: Readonly<Record<string, Fait<boolean | number | string>>>,
) {
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
