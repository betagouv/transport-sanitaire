// Le côté de l'USLD et de l'EHPAD que Q2.6 cite, sur la page d'arrivée
// (QST-LIEUX-TROIS-CATEGORIES-20261105, QST-COTE-LIEUX-20261113). Il ne se
// demande que si les deux catégories choisies laissent encore plus d'un
// placement (`conditions/cotes-de-q26.ts`) : un retour à domicile depuis une
// USLD n'en pose aucune. « Au départ et à l'arrivée » se propose quand les deux
// extrémités permettent la structure.

import type { Condition, Value } from "../../../../../socle/index.ts";
import { given, question } from "../../question.ts";
import {
  type Choix,
  type NatureDeQ26,
  type Placement,
  placementsPossibles,
} from "../conditions/cotes-de-q26.ts";
import { ENTREES_DES_LIEUX } from "../conditions/roles-dans-le-sens.ts";
import { avecUnDocument } from "../conditions/supports-du-complement.ts";

const COTES = {
  "1_DEPART": "Au départ",
  "2_ARRIVEE": "À l’arrivée",
  "3_LES_DEUX": "Au départ et à l’arrivée",
} as const;

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
    given.question(usld).answer().compute(placementDe),
  );
  const ehpad = coteDeLEhpad(possibles("3_EHPAD", avecUsld));
  const choix = avecLeCote(
    "3_EHPAD",
    avecUsld,
    given.question(ehpad).answer().compute(placementDe),
  );
  return { usld, ehpad, choix };
}

// ---- implémentation ----

const PLACEMENTS: Record<Cote, Placement> = {
  "1_DEPART": "depart",
  "2_ARRIVEE": "arrivee",
  "3_LES_DEUX": "les_deux",
};

function possibles(nature: NatureDeQ26, choix: Value<Choix>) {
  return ENTREES_DES_LIEUX.computeWith(choix, (entrees, lu) =>
    placementsPossibles(nature, entrees, lu),
  );
}

function enDoute(placements: Value<Placement[]>): Condition {
  return placements.compute((possibles) => possibles.length > 1);
}

function offert(placements: Value<Placement[]>, placement: Placement) {
  return placements.compute((possibles) => possibles.includes(placement));
}

function coteDeLUsld(placements: Value<Placement[]>) {
  return coteDe(
    "Q3.lieux.usld.cote",
    "De quel côté se trouve l’unité de soins de longue durée (USLD) ?",
    placements,
  );
}

function coteDeLEhpad(placements: Value<Placement[]>) {
  return coteDe(
    "Q3.lieux.ehpad.cote",
    "De quel côté se trouve l’établissement d’hébergement pour personnes âgées dépendantes (EHPAD) ?",
    placements,
  );
}

// La question de côté : chaque réponse ne se propose que si son placement
// reste possible.
function coteDe<Id extends string>(
  id: Id,
  libelle: string,
  placements: Value<Placement[]>,
) {
  return question
    .singleChoice(id, libelle)
    .options(COTES)
    .option("1_DEPART", (option) =>
      option.offeredWhen(offert(placements, "depart")),
    )
    .option("2_ARRIVEE", (option) =>
      option.offeredWhen(offert(placements, "arrivee")),
    )
    .option("3_LES_DEUX", (option) =>
      option.offeredWhen(offert(placements, "les_deux")),
    )
    .mattersWhile(avecUnDocument.and(enDoute(placements)));
}

// Le placement que la réponse désigne.
function placementDe(reponse: { readonly value?: Cote }): Placement | SansCote {
  return reponse.value && PLACEMENTS[reponse.value];
}

// Le choix, avec le placement que cette question donne.
function avecLeCote(
  nature: NatureDeQ26,
  choix: Value<Choix>,
  cote: Value<Placement | undefined>,
): Value<Choix> {
  return choix.computeWith(cote, (lu, extremite) => ({
    ...lu,
    cotes: { ...lu.cotes, [nature]: extremite },
  }));
}
