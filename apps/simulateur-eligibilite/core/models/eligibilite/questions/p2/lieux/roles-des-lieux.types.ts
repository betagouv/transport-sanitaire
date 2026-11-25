// Les entrées des rôles des lieux : les questions dont les lieux se tirent,
// chacune sous son nom (`roles-des-lieux.service.ts`).
//
// Les règles lisent les réponses sous leur nom (`Entrees`). Ce module n'importe
// les questions que pour leur type : une question de P2 peut ainsi le lire.

import type { AnswerOf, GivenAnswer } from "../../../../../socle/index.ts";
import type { Q1_3 } from "../../p1/questions/q1-3.question.ts";
import type { Q2_1_G } from "../questions/q2-1.question.ts";
import type { Q2_2_1 } from "../questions/q2-2-1.question.ts";
import type { Q2_2_1_A } from "../questions/q2-2-1-a.question.ts";
import type { Q2_2_1_CADRE } from "../questions/q2-2-1-cadre.question.ts";
import type { Q2_5 } from "../questions/q2-5.question.ts";
import type { Q2_6 } from "../questions/q2-6.question.ts";
import type { Q2_13_DEPART, Q2_13_SENS } from "../questions/q2-13.question.ts";
import type { Nature } from "./natures-du-lieu.constants.ts";
import type { Etablie, Orientation } from "./situations-des-lieux.types.ts";

export type Extremite = "depart" | "arrivee";

/** Les natures que Q2.6 cite sans dire lequel des deux lieux elles sont. */
export type NatureDeQ26 = "4_USLD" | "3_EHPAD";

export type { Etablie, Nature, Orientation };

/**
 * Les questions dont les lieux se tirent, chacune sous son nom. La dernière
 * dit le sens, qualifié avant R2. Plusieurs permissions n'en disent
 * aucun.
 */
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
};

/**
 * Les réponses dont les lieux se tirent, lues sous leur nom : leur valeur, une
 * réponse possible, une case.
 */
export type Entrees = {
  readonly [Nom in keyof Lues]: Pick<
    GivenAnswer<AnswerOf<Lues[Nom]>>,
    "value" | "is" | "checked"
  >;
};
