// Le métier du modèle de démonstration : ses questions, sa préconisation, ses
// seeds, ce que disent ses deux résultats, et son besoin. Son écran
// (`front/models/fake/`) s'y ajoute.

import { CoreModelFactory, type ValueOf } from "../../socle/index.ts";
import { BESOIN } from "./besoin.ts";
import { cibles } from "./cibles/evaluation.ts";
import type { Cibles } from "./cibles/noms.ts";
import { CATALOGUE_DES_FAITS } from "./faits/index.ts";
import type { Faits } from "./faits/noms.ts";
import { faits } from "./faits/preconisation.ts";
import { COMMANDE } from "./questions/p1/partie-1.constants.ts";
import { COMPLEMENT } from "./questions/p2/partie-2.constants.ts";
import type { Questions } from "./questions/reponses.ts";
import { type LuParLeResultat, R2 } from "./r2/r2.ts";
import { type DtosDesDocuments, R3 } from "./r3/r3.ts";

export const model = CoreModelFactory.define<
  Questions,
  Faits,
  Cibles,
  LuParLeResultat,
  ValueOf<typeof R3.lit>,
  DtosDesDocuments
>({
  preconisation: { faits, cibles, reads: CATALOGUE_DES_FAITS.reads },
  questionnaire: [COMMANDE],
  complement: COMPLEMENT,
  seeds: () => import("./seeds-catalogue.ts").then((m) => m.SEEDS),
  result: { reading: R2.lit },
  cerfa: {
    document: R3.document,
    values: R3.valeurs,
    title: R3.titre,
    reading: R3.lit,
    startLabel: R3.boutonDeDepart,
  },
  intent: BESOIN,
});
