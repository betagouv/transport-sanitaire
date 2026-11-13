// Le côté de l'USLD et de l'EHPAD que Q2.6 cite (QST-LIEUX-TROIS-CATEGORIES-20261105,
// QST-COTE-LIEUX-20261113, `contraintes-lieux.mjs`). Q2.6 prouve la nature d'un
// lieu au moins, pas lequel : un côté, ou les deux quand les deux extrémités
// la permettent. P2 la place quand elle le peut, les catégories choisies en P3
// réduisent les placements possibles, et seul un doute qui reste se demande.
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

/** Aucune structure de Q2.6 n'est à coup sûr à ce lieu. */
type PasCertaine = undefined;

/** Où se trouve une nature de Q2.6 : un côté, ou les deux. */
export type Placement = Extremite | "les_deux";

/** Le placement de chaque nature de Q2.6, quand on le connaît. */
export type Repartition = { readonly [Nature in NatureDeQ26]?: Placement };

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
          .filter((placement) => !dejaOccupe(partielle, placement))
          .map((placement) => ({ ...partielle, [nature]: placement })),
      ),
    [{}],
  );
}

/** Les placements que cette nature de Q2.6 peut encore prendre. */
export function placementsPossibles(
  nature: NatureDeQ26,
  entrees: Entrees,
  choix: Choix,
): Placement[] {
  const vus = repartitions(entrees, choix).map((r) => r[nature]);
  return PLACEMENTS.filter((placement) => vus.includes(placement));
}

/** La nature de Q2.6 que ce lieu est à coup sûr, s'il en est une. */
export function natureDeQ26Au(
  extremite: Extremite,
  entrees: Entrees,
  choix: Choix,
): NatureDeQ26 | PasCertaine {
  const toutes = repartitions(entrees, choix);
  return naturesDeQ26(entrees).find(
    (nature) =>
      toutes.length > 0 &&
      toutes.every((r) => extremitesDe(r[nature]).includes(extremite)),
  );
}

// ---- implémentation ----

const EXTREMITES = ["depart", "arrivee"] as const;

const PLACEMENTS: readonly Placement[] = [...EXTREMITES, "les_deux"];

// Les lieux que couvre ce placement.
function extremitesDe(placement: Placement | undefined): Extremite[] {
  if (placement === undefined) return [];
  return placement === "les_deux" ? [...EXTREMITES] : [placement];
}

// Une autre nature tient déjà l'un de ces lieux.
function dejaOccupe(partielle: Repartition, placement: Placement): boolean {
  const pris = Object.values(partielle).flatMap(extremitesDe);
  return extremitesDe(placement).some((extremite) => pris.includes(extremite));
}

// Le lieu que P2 fixe à cette nature, ou les deux, sinon ceux que P2 et la
// catégorie choisie laissent : un côté, ou les deux s'ils le permettent tous
// deux. Le côté répondu tranche.
function candidats(
  nature: NatureDeQ26,
  entrees: Entrees,
  { categories = {}, cotes = {} }: Choix,
): Placement[] {
  const etablis = lieuxEtablis(entrees);
  const acquis = EXTREMITES.filter((e) => etablis[e]?.nature === nature);
  const permis = (acquis.length > 0 ? acquis : [...EXTREMITES]).filter(
    (extremite) =>
      [undefined, categorieDe(nature)].includes(categories[extremite]) &&
      naturesPermises(extremite, entrees).includes(nature),
  );
  const placements: Placement[] =
    acquis.length === 2 && permis.length === 2
      ? ["les_deux"]
      : permis.length === 2
        ? [...permis, "les_deux"]
        : permis;
  return placements.filter(
    (placement) => cotes[nature] === undefined || cotes[nature] === placement,
  );
}
