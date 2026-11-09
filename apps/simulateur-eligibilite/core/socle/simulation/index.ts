// Ce que la simulation promet au reste du socle et à l'écran : l'agrégat du
// parcours, la préconisation de réponses, le périmètre d'un résultat, les
// seeds.

export type { Position } from "./position.ts";
export { preconisationOf } from "./preconisation.ts";
export { resultScope } from "./result-scope.ts";
export { evaluateSeed, type Seed, type SeedEvaluation } from "./seed.ts";
export { Simulation } from "./simulation.ts";
