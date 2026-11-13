// Ce que le moteur de décision promet au reste du socle : les faits et les
// cibles en valeurs, leur catalogue, le graphe des règles. Le moteur qui
// calcule les cibles (`publicodes-decision-engine.adapter.ts`) reste une porte
// à part : il importe publicodes, qui ne doit entrer que dans le chunk d'un
// modèle.

export { Cible, type CibleValues, cibleValues } from "./cible.ts";
export { DecisionDiagram } from "./decision-graph/diagram.ts";
export {
  DecisionGraph,
  type DecisionGraphData,
  type FaitValue,
  type RuleValue,
} from "./decision-graph/graph.ts";
export { FaitCatalogue } from "./establish-the-faits.ts";
export { type FaitDeclare, unFait } from "./fait/declared.ts";
export { Fait } from "./fait/fait.ts";
export { uneRegle } from "./fait/regle.ts";
