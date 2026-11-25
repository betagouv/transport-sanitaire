// Le métier du modèle de l'éditeur, dont `rules/VERSION` porte le numéro : ses
// questions, sa préconisation, ses seeds, et ce que disent ses deux résultats,
// R2 et R3 (`r2/`, `r3/`), avec le besoin du prescripteur. Leur rendu est dans
// `front/models/eligibilite/`.

import { CoreModelFactory, type DecisionGraphData } from "../../socle/index.ts";
import { BESOIN } from "./besoin.ts";
import { decisionEngine } from "./cibles/evaluation.ts";
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
import { resultatDeR2 } from "./r2/calcul-du-resultat.ts";
import { type Lecture, R2, type ResultatR2 } from "./r2/r2.ts";
import { type DtosDesDocuments, R3 } from "./r3/r3.ts";
import graphe from "./rules/regles.graphe.json" with { type: "json" };

const GRAPHE = graphe as DecisionGraphData;

export const model = CoreModelFactory.define<
  Questions,
  Faits,
  Cibles,
  Lecture["reading"],
  object,
  DtosDesDocuments,
  ResultatR2
>({
  preconisation: {
    faits,
    cibles: (faits) => decisionEngine.cibles(faits),
    reads: LECTURES_DES_FAITS,
  },
  questionnaire: PARTS,
  complement: COMPLEMENT,
  seeds: () => import("./seeds-catalogue.ts").then((m) => m.SEEDS),
  decision: {
    graph: GRAPHE,
    imposed: FAITS_IMPOSES,
    faits: faitsSansLaDecision,
  },
  result: { reading: R2.lit, compute: resultatDeR2 },
  cerfa: {
    document: R3.document,
    values: R3.valeurs,
    title: R3.titre,
    reading: R3.lit,
    startLabel: R3.boutonDeDepart,
    measured: R3.mesurees,
  },
  intent: BESOIN,
});
