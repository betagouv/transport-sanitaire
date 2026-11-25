// Les entrées des lieux, dans le sens du document : les réponses de P2 et
// Q3.1.2, chacune sous son nom (`roles-dans-le-sens.service.ts`).

import type { AnswerOf, GivenAnswer } from "../../../../../socle/index.ts";
import type { Q1_3 } from "../../p1/questions/q1-3.question.ts";
import type { Q2_1_G } from "../../p2/questions/q2-1.question.ts";
import type { Q2_2_1 } from "../../p2/questions/q2-2-1.question.ts";
import type { Q2_2_1_A } from "../../p2/questions/q2-2-1-a.question.ts";
import type { Q2_2_1_CADRE } from "../../p2/questions/q2-2-1-cadre.question.ts";
import type { Q2_5 } from "../../p2/questions/q2-5.question.ts";
import type { Q2_6 } from "../../p2/questions/q2-6.question.ts";
import type {
  Q2_13_DEPART,
  Q2_13_SENS,
} from "../../p2/questions/q2-13.question.ts";
import type { Q3_1_2 } from "../questions/q3-1-2.question.ts";

export type {
  Etablie,
  Extremite,
  Nature,
} from "../../p2/lieux/roles-des-lieux.types.ts";

/** Les questions dont les lieux se tirent, chacune sous son nom. */
export type Lues = {
  readonly soins: typeof Q1_3;
  readonly sousType: typeof Q2_1_G;
  readonly situations: typeof Q2_2_1;
  readonly sejour: typeof Q2_2_1_CADRE;
  readonly enPermission: typeof Q2_2_1_A;
  readonly transfert: typeof Q2_5;
  readonly contexte: typeof Q2_6;
  readonly departDeLEntree: typeof Q2_13_DEPART;
  readonly trajetEvalue: typeof Q2_13_SENS;
  readonly sens: typeof Q3_1_2;
};

/** Ces réponses, lues sous leur nom. */
export type Entrees = {
  readonly [Nom in keyof Lues]: GivenAnswer<AnswerOf<Lues[Nom]>>;
};
