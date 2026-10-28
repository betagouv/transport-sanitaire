// Le graphe de décision tel que la pertinence le lit (#255) : ses règles
// restreintes aux faits figés, chacune fermée hors des branches qui la lisent.

import { DecisionDiagram } from "../decision-engine/decision-diagram.ts";
import type {
  DecisionGraphData,
  FaitValue,
  RuleValue,
} from "../decision-engine/decision-graph.ts";
import type { Reads } from "./condition.ts";

/** Les faits figés, par leur rang dans le graphe. */
export type Fixed = ReadonlyMap<number, FaitValue>;

/** Une branche : sa cible, et les valeurs qui l'ouvrent. */
export type Gate = {
  readonly cible: string;
  readonly values: readonly unknown[];
};

/** Ce que lisent les résultats sous ces branches, toutes ouvertes. */
export type Section = {
  readonly reads: Reads;
  readonly gates: readonly Gate[];
};

/** Le graphe de décision, et ses règles restreintes aux faits figés. */
export class RelevanceGraph {
  readonly faits: readonly string[];
  readonly #data: DecisionGraphData;
  readonly #diagram: DecisionDiagram;
  readonly #gated = new WeakMap<Section, Roots>();

  constructor(data: DecisionGraphData) {
    this.faits = data.faits;
    this.#data = data;
    this.#diagram = DecisionDiagram.of(data);
  }

  restrictedTo(fixed: Fixed): RestrictedGraph {
    return new RestrictedGraph(this, this.#diagram, fixed);
  }

  /**
   * Ce que lit cette section, chaque règle fermée hors de ses branches. Fermer
   * puis restreindre vaut restreindre puis fermer : une section se ferme une
   * fois pour toutes.
   */
  gated(section: Section): Roots {
    const known = this.#gated.get(section);
    if (known) return known;
    const roots = this.#gate(section);
    this.#gated.set(section, roots);
    return roots;
  }

  /** La règle qui calcule cette cible. */
  rule(cible: string): number {
    const id = this.#data.rules[cible];
    if (id === undefined) {
      throw new Error(`Le graphe ne calcule pas la règle « ${cible} ».`);
    }
    return id;
  }

  #gate({ reads, gates }: Section): Roots {
    const selectors = gates.map(({ cible }) => this.rule(cible));
    const gate = (id: number) =>
      gates.length === 0
        ? id
        : this.#diagram.apply(
            `branche:${JSON.stringify(gates.map(({ values }) => values))}`,
            (...values) => openedBy(gates, values),
            [...selectors, id],
          );
    const inGraph = reads.faits.filter((nom) => this.faits.includes(nom));
    const ids = [
      ...reads.cibles.map((cible) => this.rule(cible)),
      ...inGraph.map((nom) => this.#diagram.fait(this.faits.indexOf(nom))),
    ];
    return {
      ids: ids.map(gate),
      faits: reads.faits.filter((nom) => !inGraph.includes(nom)),
    };
  }
}

// Une lecture fermée : les règles et les faits qu'elle lit, chacun sous ses
// branches. Un fait hors du graphe se lit tel quel (`faits`).
type Roots = {
  readonly ids: readonly number[];
  readonly faits: readonly string[];
};

export class RestrictedGraph {
  readonly #graph: RelevanceGraph;
  readonly #diagram: DecisionDiagram;
  readonly #restrict: (id: number) => number;

  constructor(graph: RelevanceGraph, diagram: DecisionDiagram, fixed: Fixed) {
    this.#graph = graph;
    this.#diagram = diagram;
    this.#restrict = diagram.restrictorTo(fixed);
  }

  /** Cette branche peut-elle encore s'ouvrir ? */
  readonly opens = ({ cible, values }: Gate): boolean => {
    const rule = this.#restrict(this.#graph.rule(cible));
    const reached = this.#diagram.valuesOf(rule);
    return values.some((value) => reached.has(value as RuleValue));
  };

  /**
   * Les faits dont cette section dépend encore : ceux qu'elle lit hors du
   * graphe, et ceux que ses règles restreintes testent.
   */
  dependsOn(section: Section): ReadonlySet<string> {
    const { ids, faits } = this.#graph.gated(section);
    const restricted = ids.map(this.#restrict);
    const tested = this.#diagram.testedFaits(...restricted);
    return new Set([
      ...faits,
      ...this.#graph.faits.filter((_nom, rank) => tested.has(rank)),
    ]);
  }
}

// ---- implémentation ----

// La valeur de la règle quand chaque branche s'ouvre, une même constante sinon.
function openedBy(gates: readonly Gate[], values: readonly RuleValue[]) {
  const open = gates.every(({ values: opening }, rank) =>
    opening.includes(values[rank]),
  );
  return open ? values[gates.length] : null;
}
