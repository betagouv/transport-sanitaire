// Les rôles des lieux que P2 établit (`p2/conditions/roles-des-lieux.ts`), lus
// dans le sens du document : Q2.13.sens ou Q3.1.2 (`sens-du-trajet.ts`).
// Plusieurs permissions ne disent aucun sens (D-284).
//
// Les règles lisent les réponses sous leur nom (`Entrees`). Une garde les
// reçoit de `ENTREES_DES_LIEUX`, un rappel de `entreesDe`.

import type {
  Answered,
  AnswerOf,
  GivenAnswer,
  GivenAnswers,
  ReadByObject,
  Value,
} from "../../../../../socle/index.ts";
import { Q1_3 } from "../../p1/questions/q1-3.ts";
import {
  desRolesContradictoires as contradictoiresDans,
  type Extremite,
  lieuxEtablis as etablisDans,
  type Nature,
  naturesDeQ26,
  type Orientation,
  naturesPermises as permisesDans,
} from "../../p2/conditions/roles-des-lieux.ts";
import { Q2_1_G } from "../../p2/questions/q2-1.ts";
import { Q2_2_1 } from "../../p2/questions/q2-2-1.ts";
import { Q2_2_1_A } from "../../p2/questions/q2-2-1-a.ts";
import { Q2_2_1_CADRE } from "../../p2/questions/q2-2-1-cadre.ts";
import { Q2_5 } from "../../p2/questions/q2-5.ts";
import { Q2_6 } from "../../p2/questions/q2-6.ts";
import { Q2_13_DEPART, Q2_13_SENS } from "../../p2/questions/q2-13.ts";
import { given, type Inconnu } from "../../question.ts";
import { Q3_1_2 } from "../questions/q3-1-2.ts";
import { sensChoisi } from "./sens-du-trajet.ts";

export type {
  Etablie,
  Extremite,
  Nature,
  NatureDeQ26,
} from "../../p2/conditions/roles-des-lieux.ts";

export { naturesDeQ26 };

/** Les réponses dont les lieux se tirent, chacune sous son nom. */
const LUES = {
  soins: Q1_3,
  sousType: Q2_1_G,
  situations: Q2_2_1,
  sejour: Q2_2_1_CADRE,
  enPermission: Q2_2_1_A,
  transfert: Q2_5,
  contexte: Q2_6,
  departDeLEntree: Q2_13_DEPART,
  trajetEvalue: Q2_13_SENS,
  sens: Q3_1_2,
} as const;

/** Ces réponses, lues sous leur nom. */
export type Entrees = {
  readonly [Nom in keyof typeof LUES]: GivenAnswer<
    AnswerOf<(typeof LUES)[Nom]>
  >;
};

/** Les entrées des lieux, telles qu'une garde les lit à sa place. */
export const ENTREES_DES_LIEUX = given.all(
  Object.fromEntries(
    Object.entries(LUES).map(([nom, lue]) => [
      nom,
      given.question(lue).answer(),
    ]),
  ),
  // `Object.fromEntries` perd les noms : chacun garde la réponse de sa question.
) as unknown as Value<Entrees>;

/** Les entrées des lieux, lues sur les réponses d'un rappel. */
export function entreesDe(answers: GivenAnswers<ReadByObject>): Entrees {
  return Object.fromEntries(
    (Object.entries(LUES) as [string, Answered][]).map(([nom, lue]) => [
      nom,
      answers.question(lue),
    ]),
  ) as unknown as Entrees;
}

/** Les lieux que P2 établit, dans le sens du document. */
export function lieuxEtablis(entrees: Entrees) {
  return etablisDans(entrees, orientationDe(entrees));
}

/**
 * Deux situations de P2 donnent-elles à un lieu, dans ce sens, des natures
 * inconciliables (TS1014-AUDIT-02) ?
 */
export function desRolesContradictoires(entrees: Entrees): boolean {
  return contradictoiresDans(entrees, orientationDe(entrees));
}

/** Les natures que P2 permet à ce lieu, dans le sens du document. */
export function naturesPermises(
  extremite: Extremite,
  entrees: Entrees,
): readonly Nature[] {
  return permisesDans(extremite, entrees, orientationDe(entrees));
}

// ---- implémentation ----

// Un aller-retour équivalent se décrit dans le sens de l'aller.
function orientationDe(entrees: Entrees): Orientation | Inconnu {
  const sens = sensChoisi(entrees);
  if (sens === undefined) return undefined;
  return sens === "2_RETOUR" ? "retour" : "aller";
}
