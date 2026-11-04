// Ce que plusieurs faits lisent : la boisson et ses accompagnements, et les
// raisons qu'ils partagent mot pour mot.
//
// Un fait lit les questions validées. `given` ne vient pas de
// `questions/question.ts` : un fait ne lit pas de cible.

import { givenOf } from "../../../socle/index.ts";
import type { Questions } from "../questions/reponses.ts";
import type { Faits } from "./noms.ts";

const given = givenOf<Questions, Faits>();

/** La boisson commandée. */
export const BOISSON = given.question("boisson").answer();

/** Ce qui l'accompagne. */
export const AVEC = given.question("accompagnements").answer();

export const RIEN_COMMANDE = "Rien n'est commandé.";
export const PAS_ENCORE_VALIDES =
  "Les accompagnements ne sont pas encore validés.";
