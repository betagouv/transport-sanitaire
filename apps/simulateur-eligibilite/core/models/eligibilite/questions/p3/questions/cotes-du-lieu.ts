// Le côté de l'USLD et de l'EHPAD que Q2.6 cite, sur la page d'arrivée
// (QST-LIEUX-TROIS-CATEGORIES-20261105). Il ne se demande que si les deux
// catégories choisies laissent encore les deux côtés possibles
// (`conditions/cotes-de-q26.ts`) : un retour à domicile depuis une USLD n'en
// pose aucune.

import type { Condition, Value } from "../../../../../socle/index.ts";
import { given, question } from "../../question.ts";
import {
  type Choix,
  cotesPossibles,
  type NatureDeQ26,
} from "../conditions/cotes-de-q26.ts";
import type { Extremite } from "../conditions/lieux-du-trajet.ts";
import { ENTREES_DES_LIEUX } from "../conditions/roles-dans-le-sens.ts";
import { avecUnDocument } from "../conditions/supports-du-complement.ts";

// Les côtés, provisoires tant que l'éditeur ne les fixe pas.
const COTES = { "1_DEPART": "Au départ", "2_ARRIVEE": "À l’arrivée" } as const;

type Cote = keyof typeof COTES;

/** La question de côté n'a pas de réponse. */
type SansCote = undefined;

/**
 * Les deux questions de côté, et le choix des lieux une fois répondues. Celle
 * de l'EHPAD lit celle de l'USLD : deux natures ne se placent pas au même lieu.
 */
export function cotesDesStructures(categories: Value<Choix>) {
  const usld = coteDeLUsld(possibles("4_USLD", categories));
  const avecUsld = avecLeCote(
    "4_USLD",
    categories,
    given.question(usld).answer().compute(coteDe),
  );
  const ehpad = coteDeLEhpad(possibles("3_EHPAD", avecUsld));
  const choix = avecLeCote(
    "3_EHPAD",
    avecUsld,
    given.question(ehpad).answer().compute(coteDe),
  );
  return { usld, ehpad, choix };
}

// ---- implémentation ----

const EXTREMITES: Record<Cote, Extremite> = {
  "1_DEPART": "depart",
  "2_ARRIVEE": "arrivee",
};

function possibles(nature: NatureDeQ26, choix: Value<Choix>) {
  return ENTREES_DES_LIEUX.computeWith(choix, (entrees, lu) =>
    cotesPossibles(nature, entrees, lu),
  );
}

function offert(cotes: Value<Extremite[]>, extremite: Extremite): Condition {
  return cotes.compute((possibles) => possibles.includes(extremite));
}

function enDoute(cotes: Value<Extremite[]>): Condition {
  return cotes.compute((possibles) => possibles.length > 1);
}

function coteDeLUsld(cotes: Value<Extremite[]>) {
  return question
    .singleChoice(
      "Q3.lieux.usld.cote",
      "De quel côté se trouve l’unité de soins de longue durée (USLD) ?",
    )
    .options(COTES)
    .option("1_DEPART", (option) => option.offeredWhen(offert(cotes, "depart")))
    .option("2_ARRIVEE", (option) =>
      option.offeredWhen(offert(cotes, "arrivee")),
    )
    .mattersWhile(avecUnDocument.and(enDoute(cotes)));
}

function coteDeLEhpad(cotes: Value<Extremite[]>) {
  return question
    .singleChoice("Q3.lieux.ehpad.cote", "De quel côté se trouve l’EHPAD ?")
    .options(COTES)
    .option("1_DEPART", (option) => option.offeredWhen(offert(cotes, "depart")))
    .option("2_ARRIVEE", (option) =>
      option.offeredWhen(offert(cotes, "arrivee")),
    )
    .mattersWhile(avecUnDocument.and(enDoute(cotes)));
}

// Le lieu que la réponse désigne.
function coteDe(reponse: { readonly value?: Cote }): Extremite | SansCote {
  return reponse.value && EXTREMITES[reponse.value];
}

// Le choix, avec le côté que cette question donne.
function avecLeCote(
  nature: NatureDeQ26,
  choix: Value<Choix>,
  cote: Value<Extremite | undefined>,
): Value<Choix> {
  return choix.computeWith(cote, (lu, extremite) => ({
    ...lu,
    cotes: { ...lu.cotes, [nature]: extremite },
  }));
}
