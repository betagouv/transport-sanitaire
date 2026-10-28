// Les nœuds du graphe de décision, et ce qu'on en construit (#196). Le
// compilateur y combine les règles (`decision-graph-compiler.ts`). Le filtrage
// (#255) y restreint une règle aux faits qu'on sait déjà, puis regarde quels
// faits elle teste encore.
//
// Les nœuds sont partagés : deux nœuds identiques n'en font qu'un, et un fait
// dont les trois réponses mènent au même nœud ne se teste pas. Une règle qui
// ne dépend plus d'un fait ne le teste donc plus.

import {
  type DecisionGraphData,
  type FaitValue,
  type GraphNode,
  isTest,
  type RuleValue,
} from "./decision-graph.ts";

/** Les faits fixés, par leur rang dans le graphe, et ce qu'ils valent. */
export type FixedFaits = ReadonlyMap<number, FaitValue>;

/** Les nœuds d'un graphe, et les graphes qu'on en tire. */
export class DecisionDiagram {
  readonly nodes: GraphNode[] = [];
  private readonly unique = new Map<string, number>();
  private readonly memo = new Map<string, number>();

  /** Les nœuds de ce graphe, aux mêmes numéros. */
  static of(data: DecisionGraphData): DecisionDiagram {
    const diagram = new DecisionDiagram();
    for (const node of data.nodes) {
      if (isTest(node)) diagram.test(node[0], node.slice(1));
      else diagram.leaf(node.value);
    }
    if (diagram.nodes.length !== data.nodes.length) {
      throw new Error("Le graphe a des nœuds en double : il n'est pas réduit.");
    }
    return diagram;
  }

  leaf(value: RuleValue): number {
    const key = value === undefined ? "=" : `=${JSON.stringify(value)}`;
    return this.intern(key, () => (value === undefined ? {} : { value }));
  }

  fait(fait: number): number {
    const kids = [this.leaf(true), this.leaf(false), this.leaf(undefined)];
    return this.test(fait, kids);
  }

  // Combine ces graphes feuille à feuille, en testant leurs faits dans
  // l'ordre : le premier fait testé se teste d'abord, et chaque réponse
  // combine ce qui suit. `operation` nomme `combine` : deux combinaisons du
  // même nom sont la même.
  apply(
    operation: string,
    combine: (...values: RuleValue[]) => RuleValue,
    ids: readonly number[],
  ): number {
    const key = `${operation}|${ids.join(",")}`;
    const known = this.memo.get(key);
    if (known !== undefined) return known;
    const nodes = ids.map((id) => this.at(id));
    const tested = nodes.flatMap((node) => (isTest(node) ? [node[0]] : []));
    const result =
      tested.length === 0
        ? this.leaf(combine(...nodes.map((node) => (node as Leaf).value)))
        : this.branch(operation, combine, ids, Math.min(...tested));
    this.memo.set(key, result);
    return result;
  }

  /** Ce graphe, quand ces faits valent ce qu'on sait d'eux. */
  restrict(id: number, fixed: FixedFaits): number {
    return this.restricted(id, fixed, new Map());
  }

  /**
   * La restriction à ces faits, pour plusieurs graphes : ce qu'ils partagent ne
   * se restreint qu'une fois.
   */
  restrictorTo(fixed: FixedFaits): (id: number) => number {
    const known = new Map<number, number>();
    return (id) => this.restricted(id, fixed, known);
  }

  /** Les faits que ces graphes testent, par leur rang. */
  testedFaits(...ids: readonly number[]): ReadonlySet<number> {
    const tested = new Set<number>();
    this.visit(ids, (node) => isTest(node) && tested.add(node[0]));
    return tested;
  }

  /** Les valeurs que ce graphe peut prendre. */
  valuesOf(id: number): ReadonlySet<RuleValue> {
    const values = new Set<RuleValue>();
    this.visit([id], (node) => isTest(node) || values.add(node.value));
    return values;
  }

  // ---- implémentation ----

  // Chaque nœud atteint depuis ces graphes, une fois.
  private visit(ids: readonly number[], see: (node: GraphNode) => unknown) {
    const seen = new Set<number>();
    const pending = [...ids];
    for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
      if (seen.has(next)) continue;
      seen.add(next);
      const node = this.at(next);
      see(node);
      if (isTest(node)) pending.push(node[1], node[2], node[3]);
    }
  }

  private branch(
    operation: string,
    combine: (...values: RuleValue[]) => RuleValue,
    ids: readonly number[],
    fait: number,
  ): number {
    const kids = [1, 2, 3].map((answer) =>
      this.apply(
        operation,
        combine,
        ids.map((id) => {
          const node = this.at(id);
          return isTest(node) && node[0] === fait
            ? (node[answer] as number)
            : id;
        }),
      ),
    );
    return this.test(fait, kids);
  }

  // Un fait fixé ne se teste plus : on suit sa réponse. Les autres gardent
  // leurs trois réponses, restreintes à leur tour.
  private restricted(
    id: number,
    fixed: FixedFaits,
    known: Map<number, number>,
  ): number {
    const node = this.at(id);
    if (!isTest(node)) return id;
    const done = known.get(id);
    if (done !== undefined) return done;
    const [fait, ...kids] = node;
    const result = fixed.has(fait)
      ? this.restricted(kids[answerOf(fixed.get(fait))], fixed, known)
      : this.test(
          fait,
          kids.map((kid) => this.restricted(kid, fixed, known)),
        );
    known.set(id, result);
    return result;
  }

  private test(fait: number, [oui, non, rien]: readonly number[]): number {
    if (oui === undefined || non === undefined || rien === undefined) {
      throw new Error("Un fait testé mène à trois nœuds.");
    }
    if (oui === non && non === rien) return oui;
    return this.intern(`?${fait}:${oui},${non},${rien}`, () => [
      fait,
      oui,
      non,
      rien,
    ]);
  }

  private at(id: number): GraphNode {
    const node = this.nodes[id];
    if (node === undefined) throw new Error(`Pas de nœud ${id}.`);
    return node;
  }

  private intern(key: string, make: () => GraphNode): number {
    const known = this.unique.get(key);
    if (known !== undefined) return known;
    this.nodes.push(make());
    this.unique.set(key, this.nodes.length - 1);
    return this.nodes.length - 1;
  }
}

type Leaf = { readonly value?: RuleValue };

// Le rang de la réponse parmi les trois enfants d'un test : oui, non, rien.
function answerOf(value: FaitValue): 0 | 1 | 2 {
  if (value === true) return 0;
  return value === false ? 1 : 2;
}
