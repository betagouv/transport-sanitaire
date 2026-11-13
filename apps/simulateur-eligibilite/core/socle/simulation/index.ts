// Ce que la simulation promet au reste du socle et à l'écran : l'agrégat du
// parcours et ce qui le décrit, la préconisation de réponses, la lecture d'un
// résultat, les seeds.

export { EstablishAPreconisation } from "./establish-a-preconisation.usecase.ts";
export {
  EvaluateASeed,
  type Seed,
  type SeedEvaluation,
} from "./evaluate-a-seed.usecase.ts";
export { JourneyPosition } from "./journey-position.vo.ts";
export { PageRefusal } from "./page-refusal.error.ts";
export { QuestionnaireReadingService } from "./questionnaire-reading.service.ts";
export { Simulation } from "./simulation.entity.ts";
export { Lock } from "./simulation-stage.vo.ts";
