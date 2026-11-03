// Le métier du modèle de démonstration : ses questions, sa préconisation et
// ses seeds. Son écran (`front/models/fake/`) s'y ajoute.

import type { CoreModel } from "../../socle/index.ts";
import { cibles } from "./cibles/evaluation.ts";
import type { Cibles } from "./cibles/noms.ts";
import { CATALOGUE_DES_FAITS } from "./faits/index.ts";
import type { Faits } from "./faits/noms.ts";
import { faits } from "./faits/preconisation.ts";
import type { Questions } from "./questions/catalogue.ts";
import { COMMANDE } from "./questions/p1/partie-1.ts";
import { COMPLEMENT } from "./questions/p2/partie-2.ts";

export const model: CoreModel<Questions, Faits, Cibles> = {
  preconisation: { faits, cibles, reads: CATALOGUE_DES_FAITS.reads },
  questionnaire: [COMMANDE],
  complement: COMPLEMENT,
  seeds: () => import("./seeds-catalogue.ts").then((m) => m.SEEDS),
};
