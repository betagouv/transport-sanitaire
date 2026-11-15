// Ce que le moteur de décision promet au reste du socle : les faits et les
// cibles en valeurs, leur catalogue, le graphe des règles. Le moteur qui
// calcule les cibles (`publicodes-decision-engine.adapter.ts`) reste une porte
// à part : il importe publicodes, qui ne doit entrer que dans le chunk d'un
// modèle.

export { Cible, type CibleValues } from "./cible.vo.ts";
export { DecisionDiagram } from "./decision-graph/decision-diagram.service.ts";
export {
  DecisionGraph,
  type DecisionGraphData,
  type FaitValue,
  type RuleValue,
} from "./decision-graph/decision-graph.vo.ts";
export { Fait } from "./fait/fait.vo.ts";
export { type FaitDeclare, unFait } from "./fait/fait-declare.vo.ts";
export { uneRegle } from "./fait/regle-de-fait.vo.ts";
export { FaitCatalogue } from "./fait-catalogue.service.ts";
