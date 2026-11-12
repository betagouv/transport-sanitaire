// Le côté de l'USLD et de l'EHPAD que Q2.6 cite (QST-LIEUX-TROIS-CATEGORIES-20261105,
// `contraintes-lieux.mjs`). Q2.6 prouve la nature de l'un des deux lieux, pas
// lequel : P2 la place quand elle le peut, les catégories choisies en P3
// réduisent les côtés possibles, et seul un doute qui reste se demande.
//
// Une catégorie ne prouve pas une USLD : elle écarte seulement les côtés où
// elle ne pourrait pas être.

import type { Categorie } from "./categories-du-lieu.ts";
import { categorieDe } from "./categories-du-lieu.ts";
import {
  type Entrees,
  type Extremite,
  lieuxEtablis,
  type NatureDeQ26,
  naturesDeQ26,
  naturesPermises,
} from "./roles-dans-le-sens.ts";

export type { NatureDeQ26 };

/** Le côté de chaque nature de Q2.6, quand on le connaît. */
/** Aucune structure de Q2.6 n'est à coup sûr à ce lieu. */
type PasCertaine = undefined;

export type Repartition = { readonly [Nature in NatureDeQ26]?: Extremite };

/** Ce que P3 a déjà dit des lieux : leur catégorie, le côté répondu. */
export type Choix = {
  readonly categories?: { readonly [Lieu in Extremite]?: Categorie };
  readonly cotes?: Repartition;
};

/**
 * Les façons de placer les natures de Q2.6 sur les deux lieux, vu P2 et ces
 * choix. Aucune : les lieux contredisent Q2.6.
 */
export function repartitions(entrees: Entrees, choix: Choix): Repartition[] {
  return naturesDeQ26(entrees).reduce<Repartition[]>(
    (partielles, nature) =>
      partielles.flatMap((partielle) =>
        candidats(nature, entrees, choix)
          .filter((cote) => !Object.values(partielle).includes(cote))
          .map((cote) => ({ ...partielle, [nature]: cote })),
      ),
    [{}],
  );
}

/** Les côtés où cette nature de Q2.6 peut encore être. */
export function cotesPossibles(
  nature: NatureDeQ26,
  entrees: Entrees,
  choix: Choix,
): Extremite[] {
  const cotes = repartitions(entrees, choix).map((r) => r[nature]);
  return EXTREMITES.filter((extremite) => cotes.includes(extremite));
}

/** La nature de Q2.6 que ce lieu est à coup sûr, s'il en est une. */
export function natureDeQ26Au(
  extremite: Extremite,
  entrees: Entrees,
  choix: Choix,
): NatureDeQ26 | PasCertaine {
  return naturesDeQ26(entrees).find((nature) => {
    const cotes = cotesPossibles(nature, entrees, choix);
    return cotes.length === 1 && cotes[0] === extremite;
  });
}

// ---- implémentation ----

const EXTREMITES = ["depart", "arrivee"] as const;

// Le lieu que P2 fixe à cette nature, sinon ceux que P2, la catégorie choisie
// et le côté répondu laissent.
function candidats(
  nature: NatureDeQ26,
  entrees: Entrees,
  { categories = {}, cotes = {} }: Choix,
): Extremite[] {
  const etablis = lieuxEtablis(entrees);
  const acquis = EXTREMITES.filter((e) => etablis[e]?.nature === nature);
  return (acquis.length > 0 ? acquis : [...EXTREMITES]).filter(
    (extremite) =>
      (cotes[nature] === undefined || cotes[nature] === extremite) &&
      [undefined, categorieDe(nature)].includes(categories[extremite]) &&
      naturesPermises(extremite, entrees).includes(nature),
  );
}
