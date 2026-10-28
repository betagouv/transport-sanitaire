// Le graphe de décision : ce que vaut chaque règle d'un modèle, pour chaque
// façon dont ses faits peuvent valoir oui, non ou rien (#196). Il se compile
// une fois depuis les règles (`decision-graph-compiler.ts`), s'écrit en JSON à
// côté d'elles, et se lit sans publicodes.
//
// Un nœud teste un fait, et mène à trois nœuds : le fait vaut oui, non, ou
// rien. Une feuille porte la valeur de la règle. Les règles partagent leurs
// nœuds, et aucun nœud ne teste un fait dont la règle ne dépend pas.

/**
 * Ce que vaut une règle : « oui ou non », une constante, `null` quand elle ne
 * s'applique pas, `undefined` quand il manque un fait.
 */
export type RuleValue = boolean | number | string | null | undefined;

/** Ce qu'on sait d'un fait : oui, non, ou rien. */
export type FaitValue = boolean | undefined;

/** Une feuille : la valeur de la règle. Sans valeur, il manque un fait. */
type Leaf = { readonly value?: Exclude<RuleValue, undefined> };

/** Un fait testé, et le nœud où mène chaque réponse. */
type Test = readonly [fait: number, oui: number, non: number, rien: number];

/** Un nœud du graphe : une feuille, ou un fait testé. */
export type GraphNode = Leaf | Test;

/** Le graphe tel qu'il s'écrit en JSON. */
export type DecisionGraphData = {
  /** Les faits, dans l'ordre où le graphe les teste. */
  readonly faits: readonly string[];
  /** Le premier nœud de chaque règle qui a une formule. */
  readonly rules: Readonly<Record<string, number>>;
  /** Les nœuds, chacun après ceux où il mène. */
  readonly nodes: readonly GraphNode[];
};

/** Le graphe des règles d'un modèle, lu depuis son JSON. */
export class DecisionGraph {
  private readonly data: DecisionGraphData;

  constructor(data: DecisionGraphData) {
    this.data = data;
  }

  /** Ce que vaut cette règle pour ces faits. Un fait absent ne vaut rien. */
  valueOf(rule: string, faits: Readonly<Record<string, FaitValue>>): RuleValue {
    const start = this.data.rules[rule];
    if (start === undefined) {
      throw new Error(`Le graphe ne calcule pas la règle « ${rule} ».`);
    }
    let node = this.node(start);
    while (isTest(node)) {
      const [fait, oui, non, rien] = node;
      const value = faits[this.data.faits[fait] ?? ""];
      node = this.node(value === true ? oui : value === false ? non : rien);
    }
    return node.value;
  }

  private node(id: number): GraphNode {
    const node = this.data.nodes[id];
    if (node === undefined) throw new Error(`Le graphe n'a pas de nœud ${id}.`);
    return node;
  }
}

/** Ce nœud teste un fait. */
export function isTest(node: GraphNode): node is Test {
  return Array.isArray(node);
}
