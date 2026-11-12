// Ce que P2 établit des deux lieux du trajet : les rôles de QST-LIEUX-001
// (`situations-des-lieux.ts`), lus dans une orientation, l'aller ou le retour
// (D-121). P3 la tire du sens du document (`p3/conditions/roles-dans-le-sens.ts`).
//
// Une nature établie se rappelle sans se redemander. Une nature que P2 borne
// sans la fixer, comme le lieu de vie d'une permission ou les deux bouts d'un
// transfert, se choisit parmi celles qu'elle permet. Deux rôles qui se
// contredisent se refusent.
//
// Les règles lisent les réponses sous leur nom (`Entrees`). Ce module n'importe
// les questions que pour leur type : une question de P2 peut ainsi le lire.

import type { AnswerOf, GivenAnswer } from "../../../../../socle/index.ts";
import type { Q1_3 } from "../../p1/questions/q1-3.ts";
import type { Inconnu } from "../../question.ts";
import type { Q2_1_G } from "../questions/q2-1.ts";
import type { Q2_2_1 } from "../questions/q2-2-1.ts";
import type { Q2_2_1_A } from "../questions/q2-2-1-a.ts";
import type { Q2_2_1_CADRE } from "../questions/q2-2-1-cadre.ts";
import type { Q2_5 } from "../questions/q2-5.ts";
import type { Q2_6 } from "../questions/q2-6.ts";
import type { Q2_13_DEPART, Q2_13_SENS } from "../questions/q2-13.ts";
import { NATURES_DU_LIEU, type Nature } from "./natures-du-lieu.ts";
import {
  type Etablie,
  type Lieux,
  type Orientation,
  q26,
  type Role,
  rolesDesSituations,
} from "./situations-des-lieux.ts";

export type Extremite = "depart" | "arrivee";

/** Les natures que Q2.6 cite sans dire lequel des deux lieux elles sont. */
export type NatureDeQ26 = "4_USLD" | "3_EHPAD";

export type { Etablie, Nature, Orientation };

/** Les natures que P2 établit, lieu par lieu. */
type Etablies = { readonly depart?: Etablie; readonly arrivee?: Etablie };

/**
 * Les questions dont les lieux se tirent, chacune sous son nom. La dernière
 * dit le sens, qualifié avant R2 (#365). Plusieurs permissions n'en disent
 * aucun (D-284).
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
 * option, une case.
 */
export type Entrees = {
  readonly [Nom in keyof Lues]: Pick<
    GivenAnswer<AnswerOf<Lues[Nom]>>,
    "value" | "is" | "checked"
  >;
};

/**
 * Les lieux que P2 établit. Chaque situation donne ses rôles ; la première qui
 * établit un lieu le fixe.
 */
export function lieuxEtablis(
  entrees: Entrees,
  orientation: Orientation | Inconnu,
): Etablies {
  const roles = rolesDesSituations(entrees, orientation);
  return {
    depart: etablieParmi(roles, "depart"),
    arrivee: etablieParmi(roles, "arrivee"),
  };
}

/**
 * Deux situations de P2 donnent-elles à un lieu des natures inconciliables ?
 * Par exemple, le retour d'une permission arrive à l'établissement, et un
 * retour pénitentiaire à la prison (TS1014-AUDIT-02).
 */
export function desRolesContradictoires(
  entrees: Entrees,
  orientation: Orientation | Inconnu,
): boolean {
  const roles = rolesDesSituations(entrees, orientation);
  return (["depart", "arrivee"] as const).some((extremite) => {
    const admises = naturesDuLieu(roles, extremite);
    return admises !== undefined && admises.length === 0;
  });
}

/**
 * Les natures que P2 permet à ce lieu. Un transfert va d'un établissement à un
 * autre, une radiothérapie en ville à un centre ou un cabinet. Deux rôles qui
 * se contredisent n'en laissent aucune.
 */
export function naturesPermises(
  extremite: Extremite,
  entrees: Entrees,
  orientation: Orientation | Inconnu,
): readonly Nature[] {
  const bornes = naturesDuLieu(
    rolesDesSituations(entrees, orientation),
    extremite,
  );
  return NATURES.filter(
    (nature) =>
      dansLeTransfert(nature, entrees) &&
      (bornes === undefined || bornes.includes(nature)),
  );
}

/**
 * L'USLD et l'EHPAD que Q2.6 cite : chacun est l'un des deux lieux. Avec une
 * radiothérapie en ville, c'est l'établissement d'origine, que P2 fixe.
 */
export function naturesDeQ26(entrees: Entrees): NatureDeQ26[] {
  if (q26(entrees, "8_RADIOTHERAPIE")) return [];
  return [
    ...(q26(entrees, "6_USLD") ? (["4_USLD"] as const) : []),
    ...(q26(entrees, "7_EHPAD") ? (["3_EHPAD"] as const) : []),
  ];
}

// ---- implémentation ----

const NATURES = Object.keys(NATURES_DU_LIEU) as Nature[];
const ETABLISSEMENTS: readonly Nature[] = [
  "2_ETABLISSEMENT_DE_SANTE",
  "3_EHPAD",
  "4_USLD",
];
const LIEUX_DE_RADIOTHERAPIE: readonly Nature[] = [
  "2_ETABLISSEMENT_DE_SANTE",
  "7_CABINET",
];

/** Aucune situation ne borne ce lieu : toutes les natures restent. */
type SansBorne = undefined;

/** Aucune situation ne fixe la nature de ce lieu. */
type NonEtablie = undefined;

function etablieParmi(
  roles: readonly Lieux[],
  extremite: Extremite,
): Etablie | NonEtablie {
  return roles
    .map((lieux) => lieux[extremite])
    .find((role): role is Etablie => role !== undefined && "nature" in role);
}

// Les natures que tous les rôles du lieu admettent à la fois.
function naturesDuLieu(
  roles: readonly Lieux[],
  extremite: Extremite,
): readonly Nature[] | SansBorne {
  return roles
    .map((lieux) => lieux[extremite])
    .filter((role): role is Role => role !== undefined)
    .map(naturesDuRole)
    .reduce<readonly Nature[] | SansBorne>(
      (admises, natures) =>
        admises === undefined
          ? natures
          : admises.filter((nature) => natures.includes(nature)),
      undefined,
    );
}

function naturesDuRole(role: Role): readonly Nature[] {
  return "nature" in role ? [role.nature] : role.natures;
}

// Un transfert entre établissements n'a que des établissements pour lieux, une
// radiothérapie en ville un centre ou un cabinet face à l'origine.
function dansLeTransfert(nature: Nature, entrees: Entrees): boolean {
  if (q26(entrees, "8_RADIOTHERAPIE"))
    return LIEUX_DE_RADIOTHERAPIE.includes(nature);
  if (entrees.transfert.is("1_TRANSFERT"))
    return ETABLISSEMENTS.includes(nature);
  return true;
}
