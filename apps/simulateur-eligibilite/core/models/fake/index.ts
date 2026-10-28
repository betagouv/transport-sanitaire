// Le métier du modèle de démonstration : ses questions, sa préconisation et
// ses seeds. Son écran (`front/models/fake/`) s'y ajoute.

import type { CoreModel } from "../../socle/index.ts";
import type { Cibles } from "./declarations/cibles.ts";
import type { Faits } from "./declarations/faits.ts";
import type { Questions } from "./declarations/questions.ts";
import { CATALOGUE_DES_FAITS } from "./faits.ts";
import { cibles, faits } from "./preconisation.ts";
import { COMPLEMENT, PARTS } from "./questionnaire.ts";

export const model: CoreModel<Questions, Faits, Cibles> = {
  preconisation: { faits, cibles, reads: CATALOGUE_DES_FAITS.reads },
  questionnaire: PARTS,
  complement: COMPLEMENT,
  seeds: () => import("./seeds-catalogue.ts").then((m) => m.SEEDS),
};
