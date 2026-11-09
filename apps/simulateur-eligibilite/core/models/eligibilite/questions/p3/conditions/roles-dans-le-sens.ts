// Les rôles des lieux que P2 établit (`p2/conditions/roles-des-lieux.ts`), lus
// dans le sens du document : Q3.1.2, ou l'aller-retour de plusieurs
// permissions (`sens-du-trajet.ts`, D-121).
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
  natureAdmise as admiseDans,
  desRolesContradictoires as contradictoiresDans,
  type Extremite,
  lieuxEtablis as etablisDans,
  type Nature,
  type Orientation,
} from "../../p2/conditions/roles-des-lieux.ts";
import { Q2_1_G } from "../../p2/questions/q2-1.ts";
import { Q2_2_1 } from "../../p2/questions/q2-2-1.ts";
import { Q2_2_1_A } from "../../p2/questions/q2-2-1-a.ts";
import { Q2_2_1_CADRE } from "../../p2/questions/q2-2-1-cadre.ts";
import { Q2_5 } from "../../p2/questions/q2-5.ts";
import { Q2_6 } from "../../p2/questions/q2-6.ts";
import { Q2_8_5 } from "../../p2/questions/q2-8-5.ts";
import { Q2_13_DEPART } from "../../p2/questions/q2-13.ts";
import { given, type Inconnu } from "../../question.ts";
import { Q3_1_2 } from "../questions/q3-1-2.ts";
import { sensDe } from "./sens-du-trajet.ts";

export type {
  Etablie,
  Extremite,
  Nature,
} from "../../p2/conditions/roles-des-lieux.ts";

/** Les réponses dont les lieux se tirent, chacune sous son nom. */
const LUES = {
  soins: Q1_3,
  sousType: Q2_1_G,
  situations: Q2_2_1,
  sejour: Q2_2_1_CADRE,
  enPermission: Q2_2_1_A,
  transfert: Q2_5,
  contexte: Q2_6,
  repetition: Q2_8_5,
  departDeLEntree: Q2_13_DEPART,
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

/** La nature se propose-t-elle, vu P2, le sens et l'autre lieu ? */
export function natureAdmise(
  nature: Nature,
  extremite: Extremite,
  entrees: Entrees,
  autre: Nature | undefined,
): boolean {
  const orientation = orientationDe(entrees);
  return admiseDans(nature, extremite, entrees, orientation, autre);
}

// ---- implémentation ----

// Un aller-retour équivalent se décrit dans le sens de l'aller.
function orientationDe(entrees: Entrees): Orientation | Inconnu {
  const sens = sensDe(entrees);
  if (sens === undefined) return undefined;
  return sens === "2_RETOUR" ? "retour" : "aller";
}
