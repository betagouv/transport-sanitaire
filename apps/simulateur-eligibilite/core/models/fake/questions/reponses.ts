// Les réponses du modèle de démonstration : le type de la réponse de chaque
// question, sous son identifiant, tiré des parties. Les faits, l'écran et les
// seeds les lisent par identifiant, avec `given`.

import { type AnswersOf, givenOf } from "../../../socle/index.ts";
import type { Cibles } from "../cibles/noms.ts";
import type { Faits } from "../faits/noms.ts";
import type { COMMANDE } from "./p1/partie-1.ts";
import type { COMPLEMENT } from "./p2/partie-2.ts";

export type Questions = AnswersOf<typeof COMMANDE> &
  AnswersOf<typeof COMPLEMENT>;

/** Les entrées des lectures du modèle, une question lue par identifiant. */
export const given = givenOf<Questions, Faits, Cibles>();
