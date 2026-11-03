// Le métier du modèle de démonstration : ses questions, sa préconisation et
// ses seeds. Son écran (`front/models/fake/`) s'y ajoute.

import type { CoreModel } from "../../socle/index.ts";
import { cibles } from "./cibles/evaluation.ts";
import type { Cibles } from "./cibles/noms.ts";
import { CATALOGUE_DES_FAITS } from "./faits/index.ts";
import type { Faits } from "./faits/noms.ts";
import { faits } from "./faits/preconisation.ts";
import type { Questions } from "./questions/catalogue.ts";
import { COMPLEMENT, PARTS } from "./questions/questionnaire.ts";

export const model: CoreModel<Questions, Faits, Cibles> = {
  preconisation: { faits, cibles, reads: CATALOGUE_DES_FAITS.reads },
  questionnaire: PARTS,
  complement: COMPLEMENT,
  seeds: () => import("./seeds-catalogue.ts").then((m) => m.SEEDS),
};
