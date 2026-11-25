// Ce que P2 établit des deux lieux du trajet : les rôles de QST-LIEUX-001
// (`situations-des-lieux.service.ts`), lus dans une orientation, l'aller ou le
// retour. P3 la tire du sens du document
// (`p3/lieux/roles-dans-le-sens.service.ts`).
//
// Une nature établie se rappelle sans se redemander. Une nature que P2 borne
// sans la fixer, comme le lieu de vie d'une permission ou les deux bouts d'un
// transfert, se choisit parmi celles qu'elle permet. Deux rôles qui se
// contredisent se refusent.

import type { Inconnu } from "../../question.ts";
import { NATURES_DU_LIEU, type Nature } from "./natures-du-lieu.constants.ts";
import type {
  Entrees,
  Extremite,
  NatureDeQ26,
} from "./roles-des-lieux.types.ts";
import { SituationsDesLieux } from "./situations-des-lieux.service.ts";
import type {
  Etablie,
  Lieux,
  Orientation,
  Role,
} from "./situations-des-lieux.types.ts";

/** Les natures que P2 établit, lieu par lieu. */
type Etablies = { readonly depart?: Etablie; readonly arrivee?: Etablie };

export class RolesDesLieux {
  /**
   * Les lieux que P2 établit. Chaque situation donne ses rôles ; la première qui
   * établit un lieu le fixe.
   */
  static lieuxEtablis(
    entrees: Entrees,
    orientation: Orientation | Inconnu,
  ): Etablies {
    const roles = SituationsDesLieux.rolesDesSituations(entrees, orientation);
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
  static desRolesContradictoires(
    entrees: Entrees,
    orientation: Orientation | Inconnu,
  ): boolean {
    const roles = SituationsDesLieux.rolesDesSituations(entrees, orientation);
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
  static naturesPermises(
    extremite: Extremite,
    entrees: Entrees,
    orientation: Orientation | Inconnu,
  ): readonly Nature[] {
    const bornes = naturesDuLieu(
      SituationsDesLieux.rolesDesSituations(entrees, orientation),
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
  static naturesDeQ26(entrees: Entrees): NatureDeQ26[] {
    if (SituationsDesLieux.q26(entrees, "8_RADIOTHERAPIE")) return [];
    return [
      ...(SituationsDesLieux.q26(entrees, "6_USLD")
        ? (["4_USLD"] as const)
        : []),
      ...(SituationsDesLieux.q26(entrees, "7_EHPAD")
        ? (["3_EHPAD"] as const)
        : []),
    ];
  }
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
  if (SituationsDesLieux.q26(entrees, "8_RADIOTHERAPIE"))
    return LIEUX_DE_RADIOTHERAPIE.includes(nature);
  if (entrees.transfert.is("1_TRANSFERT"))
    return ETABLISSEMENTS.includes(nature);
  return true;
}
