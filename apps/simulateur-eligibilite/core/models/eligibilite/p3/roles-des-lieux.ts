// Ce que P2 établit des deux lieux du trajet : les rôles de QST-LIEUX-001
// (`situations-des-lieux.ts`), lus dans le sens que Q3.1.2 ou Q2.8 donne
// (D-121).
//
// Une nature établie se rappelle sans se redemander. Une nature que P2 borne
// sans la fixer, comme le lieu de vie d'une permission ou les deux bouts d'un
// transfert, se choisit parmi celles qu'elle permet. Deux rôles qui se
// contredisent se refusent.
//
// Les règles lisent les réponses de P2 sous leur nom (`Entrees`). Une garde
// les reçoit de `ENTREES_DES_LIEUX`, un rappel de `entreesDe`.

import type { GivenAnswer, GivenAnswers, Value } from "../../../socle/index.ts";
import type { OPTIONS, Questions } from "../declarations/questions.ts";
import { given } from "../question.ts";
import {
  type Etablie,
  type Lieux,
  q26,
  type Role,
  rolesDesSituations,
} from "./situations-des-lieux.ts";

export type Extremite = "depart" | "arrivee";

/** La nature d'un lieu, du domicile à l'autre lieu. */
export type Nature = keyof (typeof OPTIONS)["Q3.2.nature"];

export type { Etablie };

/** Les natures que P2 établit, lieu par lieu. */
type Etablies = { readonly depart?: Etablie; readonly arrivee?: Etablie };

/** Les réponses de P2 dont les lieux se tirent, chacune sous son nom. */
const IDS = {
  soins: "Q1.3",
  motif: "Q2.1",
  sousType: "Q2.1.g",
  situations: "Q2.2.1",
  sejour: "Q2.2.1.cadre",
  enPermission: "Q2.2.1.a",
  transfert: "Q2.5",
  contexte: "Q2.6",
  repetition: "Q2.8.5",
  departDeLEntree: "Q2.13.depart",
  sens: "Q3.1.2",
} as const;

/** Ces réponses, lues sous leur nom. */
export type Entrees = {
  readonly [Nom in keyof typeof IDS]: GivenAnswer<Questions[(typeof IDS)[Nom]]>;
};

/** Les entrées des lieux, telles qu'une garde les lit à sa place. */
export const ENTREES_DES_LIEUX = given.all(
  Object.fromEntries(
    Object.entries(IDS).map(([nom, id]) => [nom, given.question(id).answer()]),
  ),
  // `Object.fromEntries` perd les noms : chacun garde la réponse de son id.
) as unknown as Value<Entrees>;

/** Les entrées des lieux, lues sur les réponses d'un rappel. */
export function entreesDe(answers: GivenAnswers<Questions>): Entrees {
  return Object.fromEntries(
    Object.entries(IDS).map(([nom, id]) => [nom, answers.question(id)]),
  ) as unknown as Entrees;
}

/**
 * Les lieux que P2 établit. Chaque situation donne ses rôles ; la première qui
 * établit un lieu le fixe.
 */
export function lieuxEtablis(entrees: Entrees): Etablies {
  const roles = rolesDesSituations(entrees);
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
export function desRolesContradictoires(entrees: Entrees): boolean {
  const roles = rolesDesSituations(entrees);
  return (["depart", "arrivee"] as const).some((extremite) => {
    const admises = naturesDuLieu(roles, extremite);
    return admises !== undefined && admises.length === 0;
  });
}

/**
 * La nature se propose-t-elle, vu P2 et l'autre lieu ? Un transfert va d'un
 * établissement à un autre, une radiothérapie en ville à un centre ou un
 * cabinet. L'USLD ou l'EHPAD de Q2.6 est l'un des deux lieux.
 */
export function natureAdmise(
  nature: Nature,
  extremite: Extremite,
  entrees: Entrees,
  autre: Nature | undefined,
): boolean {
  if (nature === "1_DOMICILE" && autre === "1_DOMICILE") return false;
  if (!dansLeTransfert(nature, entrees)) return false;
  const bornes = naturesDuLieu(rolesDesSituations(entrees), extremite);
  if (bornes !== undefined && !bornes.includes(nature)) return false;
  if (extremite === "depart" && autre === undefined) return true;
  const manquantes = naturesRequises(entrees).filter((n) => n !== autre);
  return manquantes.length === 0 || manquantes.includes(nature);
}

// ---- implémentation ----

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

// L'USLD et l'EHPAD que Q2.6 cite : l'un des deux lieux en est un. Avec une
// radiothérapie en ville, c'est l'établissement d'origine, que P2 fixe.
function naturesRequises(entrees: Entrees): Nature[] {
  if (q26(entrees, "8_RADIOTHERAPIE")) return [];
  return [
    ...(q26(entrees, "6_USLD") ? (["4_USLD"] as const) : []),
    ...(q26(entrees, "7_EHPAD") ? (["3_EHPAD"] as const) : []),
  ];
}
