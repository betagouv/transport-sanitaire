// Des règles publicodes au graphe de décision (#196). Une règle sans formule
// est un fait : il vaut oui, non ou rien. Une règle qui a une formule devient
// un graphe sur ces faits, qu'elle partage avec les autres.
//
// Le compilateur traduit les mécanismes que les règles de l'éditeur emploient,
// avec le sens que publicodes leur donne. Il s'arrête net sur un autre : le
// graphe dirait sinon autre chose que les règles. Un oracle le compare à
// publicodes, dans les tests de chaque modèle.

import type { ASTNode, ParsedRules } from "publicodes";
import {
  type DecisionGraphData,
  type GraphNode,
  isTest,
  type RuleValue,
} from "./decision-graph.ts";

/** Le graphe de ces règles, déjà lues par publicodes. */
export function compileDecisionGraph(
  rules: ParsedRules<string>,
): DecisionGraphData {
  const faits = Object.keys(rules).filter((name) => isFait(rules, name));
  const compiler = new RulesCompiler(rules, faits);
  const roots = Object.keys(rules)
    .filter((name) => !faits.includes(name))
    .map((name) => [name, compiler.rule(name)] as const);
  return reachableFrom(roots, faits, compiler.graph.nodes);
}

// ---- implémentation ----

// Publicodes écrit une règle sans formule en « sa valeur donnée, sinon rien ».
function isFait(rules: ParsedRules<string>, name: string): boolean {
  const rule = rules[name];
  if (!rule) return false;
  const valeur = rule.explanation.valeur;
  const sansFormule =
    valeur.nodeKind === "condition" &&
    valeur.explanation.alors.nodeKind === "constant" &&
    valeur.explanation.alors.nodeValue === undefined;
  const type = (rule.rawNode as { type?: unknown }).type;
  if (sansFormule && type !== undefined && type !== "booléen") {
    throw new Error(
      `Le fait « ${name} » est de type « ${type} » : le graphe ne connaît que oui, non ou rien.`,
    );
  }
  return sansFormule;
}

// Le sens de publicodes, relevé règle par règle et gardé par l'oracle : un
// fait absent laisse « et » et « ou » indéfinis tant que rien ne conclut, et
// `null` (non applicable) vaut « non » dans « et ».
function and(...values: RuleValue[]): RuleValue {
  if (values.some((v) => v === false || v === null)) return false;
  return values.some((v) => v === undefined) ? undefined : true;
}

function or(...values: RuleValue[]): RuleValue {
  if (values.some((v) => v === true)) return true;
  return values.some((v) => v === undefined) ? undefined : false;
}

function equal(a: RuleValue, b: RuleValue): RuleValue {
  return a === undefined || b === undefined ? undefined : a === b;
}

function different(a: RuleValue, b: RuleValue): RuleValue {
  return a === undefined || b === undefined ? undefined : a !== b;
}

function ifThen(si: RuleValue, alors: RuleValue, sinon: RuleValue): RuleValue {
  if (si === undefined) return undefined;
  return si === true ? alors : sinon;
}

function isUndefined(value: RuleValue): RuleValue {
  return value === undefined;
}

// Chaque règle se compile une fois. Une référence à `$SITUATION`, la valeur
// qu'on donnerait à une règle, ne vaut rien : seuls les faits en reçoivent.
class RulesCompiler {
  readonly graph = new GraphBuilder();
  private readonly compiled = new Map<string, number>();
  private readonly rules: ParsedRules<string>;
  private readonly faits: readonly string[];

  constructor(rules: ParsedRules<string>, faits: readonly string[]) {
    this.rules = rules;
    this.faits = faits;
  }

  rule(name: string): number {
    const fait = this.faits.indexOf(name);
    if (fait >= 0) return this.graph.fait(fait);
    if (name.endsWith(" . $SITUATION")) return this.graph.leaf(undefined);
    const known = this.compiled.get(name);
    if (known !== undefined) return known;
    const rule = this.rules[name];
    if (!rule) throw new Error(`La règle « ${name} » n'existe pas.`);
    const id = this.node(rule.explanation.valeur, name);
    this.compiled.set(name, id);
    return id;
  }

  private node(node: ASTNode, rule: string): number {
    switch (node.nodeKind) {
      case "constant":
        return this.graph.leaf(node.nodeValue as RuleValue);
      case "reference":
        return this.rule(node.dottedName ?? "");
      case "est non défini":
        return this.graph.apply("nd", isUndefined, [
          this.node(node.explanation, rule),
        ]);
      case "condition": {
        const { si, alors, sinon } = node.explanation;
        const ids = [si, alors, sinon].map((n) => this.node(n, rule));
        return this.graph.apply("si", ifThen, ids);
      }
      case "operation":
        return this.operation(node, rule);
      case "variations":
        return this.variations(node, rule);
      default:
        throw unsupported(node.nodeKind, rule);
    }
  }

  private operation(node: ASTNode<"operation">, rule: string): number {
    const combine = { et: and, ou: or, "=": equal, "!=": different }[
      node.operationKind as string
    ];
    if (!combine) throw unsupported(`opération ${node.operationKind}`, rule);
    const ids = node.explanation.map((n) => this.node(n, rule));
    return this.graph.apply(node.operationKind, combine, ids);
  }

  // Le premier bras dont la condition vaut « oui » l'emporte. Sans bras qui
  // conclut, la règle ne s'applique pas.
  private variations(node: ASTNode<"variations">, rule: string): number {
    return node.explanation.reduceRight(
      (sinon, { condition, consequence }) =>
        this.graph.apply("si", ifThen, [
          this.node(condition, rule),
          this.node(consequence, rule),
          sinon,
        ]),
      this.graph.leaf(null),
    );
  }
}

function unsupported(mechanism: string, rule: string): Error {
  return new Error(
    `Le graphe ne sait pas traduire « ${mechanism} » (règle « ${rule} »). ` +
      "Ajoute-le au compilateur, avec son cas dans l'oracle.",
  );
}

// Les nœuds, partagés : deux nœuds identiques n'en font qu'un, et un fait dont
// les trois réponses mènent au même nœud ne se teste pas.
class GraphBuilder {
  readonly nodes: GraphNode[] = [];
  private readonly unique = new Map<string, number>();
  private readonly memo = new Map<string, number>();

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
  // combine ce qui suit.
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

// Les combinaisons laissent des nœuds qu'aucune règle n'atteint : le graphe
// écrit ne garde que les autres, renumérotés dans le même ordre.
function reachableFrom(
  roots: readonly (readonly [string, number])[],
  faits: readonly string[],
  nodes: readonly GraphNode[],
): DecisionGraphData {
  const reached = new Set<number>();
  const visit = (id: number) => {
    if (reached.has(id)) return;
    reached.add(id);
    const node = nodes[id];
    if (node && isTest(node)) node.slice(1).forEach(visit);
  };
  for (const [, id] of roots) visit(id);
  const kept = [...reached].sort((a, b) => a - b);
  const renumber = new Map(kept.map((id, index) => [id, index]));
  const at = (id: number) => renumber.get(id) as number;
  return {
    faits,
    rules: Object.fromEntries(roots.map(([name, id]) => [name, at(id)])),
    nodes: kept.map((id) => {
      const node = nodes[id] as GraphNode;
      return isTest(node)
        ? [node[0], at(node[1]), at(node[2]), at(node[3])]
        : node;
    }),
  };
}
