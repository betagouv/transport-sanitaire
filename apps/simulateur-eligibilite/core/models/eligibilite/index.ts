// Le métier du modèle de l'éditeur, dont `rules/VERSION` porte le numéro : ses
// questions, sa préconisation et ses seeds. Son écran, R2 et R3, est dans
// `front/models/eligibilite/`.

import type { CoreModel } from "../../socle/index.ts";
import type { Cibles } from "./declarations/cibles.ts";
import type { Faits } from "./declarations/faits.ts";
import type { Questions } from "./declarations/questions.ts";
import { cibles } from "./evaluation-des-regles.ts";
import { COMPLEMENT } from "./p3/partie-3.ts";
import { faits } from "./preconisation.ts";
import { PARTS } from "./questionnaire.ts";

export const model: CoreModel<Questions, Faits, Cibles> = {
  preconisation: { faits, cibles },
  questionnaire: PARTS,
  complement: COMPLEMENT,
  seeds: () => import("./seeds-catalogue.ts").then((m) => m.SEEDS),
};
