// Le métier du modèle de l'éditeur, dont `rules/VERSION` porte le numéro : ses
// questions, sa préconisation et ses seeds. Son écran, R2 et R3, est dans
// `front/models/eligibilite/`.

import type { CoreModel, DecisionGraphData } from "../../socle/index.ts";
import { cibles } from "./cibles/evaluation.ts";
import type { Cibles } from "./cibles/noms.ts";
import type { Faits } from "./faits/noms.ts";
import {
  FAITS_IMPOSES,
  faits,
  faitsSansLaDecision,
  LECTURES_DES_FAITS,
} from "./faits/preconisation.ts";
import { COMPLEMENT } from "./questions/p3/partie-3.ts";
import { PARTS } from "./questions/questionnaire.ts";
import type { Questions } from "./questions/reponses.ts";
import graphe from "./rules/regles.graphe.json" with { type: "json" };

const GRAPHE = graphe as DecisionGraphData;

export const model: CoreModel<Questions, Faits, Cibles> = {
  preconisation: { faits, cibles, reads: LECTURES_DES_FAITS },
  questionnaire: PARTS,
  complement: COMPLEMENT,
  seeds: () => import("./seeds-catalogue.ts").then((m) => m.SEEDS),
  decision: {
    graph: GRAPHE,
    imposed: FAITS_IMPOSES,
    faits: faitsSansLaDecision,
  },
};
