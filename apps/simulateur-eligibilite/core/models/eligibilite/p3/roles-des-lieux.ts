// Ce que P2 établit des deux lieux du trajet : la matrice des lieux du
// catalogue (« Contrat des lieux et des segments », Q2.13, Q3.3), lue dans le
// sens que Q3.1.2 ou Q2.8 donne (D-121).
//
// Une nature établie se rappelle sans se redemander. Une nature que P2 borne
// sans la fixer, comme les deux bouts d'un transfert, se choisit parmi celles
// qu'elle permet.
//
// Les règles lisent les réponses de P2 sous leur nom (`Entrees`). Une garde
// les reçoit de `ENTREES_DES_LIEUX`, un rappel de `entreesDe`.

import type { GivenAnswer, GivenAnswers, Value } from "../../../socle/index.ts";
import { OPTIONS, type Questions } from "../declarations/questions.ts";
import { given } from "../question.ts";
import { sensDe } from "./sens-du-trajet.ts";

export type Extremite = "depart" | "arrivee";

/** La nature d'un lieu, du domicile à l'autre lieu. */
export type Nature = keyof (typeof OPTIONS)["Q3.2.nature"];

/** Une nature établie en P2, et ce que le rappel en dit. */
export type Etablie = { readonly nature: Nature; readonly rappel: string };

/** Les natures que P2 établit, lieu par lieu. */
type Lieux = { readonly depart?: Etablie; readonly arrivee?: Etablie };

/** Les réponses de P2 dont les lieux se tirent, chacune sous son nom. */
const IDS = {
  soins: "Q1.3",
  motif: "Q2.1",
  sousType: "Q2.1.g",
  cadre: "Q2.2.1",
  enPermission: "Q2.2.1.a",
  autreCadre: "Q2.2.1.b",
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
 * Les lieux que P2 établit. Chaque situation donne ses lieux ; la première qui
 * établit un lieu le fixe.
 */
export function lieuxEtablis(entrees: Entrees): Lieux {
  const lieux = SITUATIONS.map((situation) => situation(entrees));
  return {
    depart: lieux.find(({ depart }) => depart)?.depart,
    arrivee: lieux.find(({ arrivee }) => arrivee)?.arrivee,
  };
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
  if (extremite === "depart" && autre === undefined) return true;
  const manquantes = naturesRequises(entrees).filter((n) => n !== autre);
  return manquantes.length === 0 || manquantes.includes(nature);
}

// ---- implémentation ----

const ETABLISSEMENT = "2_ETABLISSEMENT_DE_SANTE";
const DOMICILE_HAD: Etablie = {
  nature: "1_DOMICILE",
  rappel: "Le domicile, pour l’admission en HAD (Hospitalisation à Domicile)",
};
const ETABLISSEMENTS: readonly Nature[] = [ETABLISSEMENT, "3_EHPAD", "4_USLD"];
const LIEUX_DE_RADIOTHERAPIE: readonly Nature[] = [ETABLISSEMENT, "7_CABINET"];

// Dans l'ordre : la première qui établit un lieu le fixe.
const SITUATIONS: readonly ((entrees: Entrees) => Lieux)[] = [
  hospitalisation,
  (entrees) => (q26(entrees, "10_ADMISSION_HAD") ? admissionEnHad() : {}),
  radiotherapie,
  (entrees) => (retourPenitentiaire(entrees) ? versLaPrison() : {}),
  permission,
  hebergement,
  departDeQ213,
  dialyse,
];

// Q2.1.g : une entrée arrive à l'établissement, une sortie en part, une
// admission en HAD arrive au domicile.
function hospitalisation(entrees: Entrees): Lieux {
  const sousType = entrees.sousType;
  if (sousType.is("1_ENTREE"))
    return {
      arrivee: {
        nature: ETABLISSEMENT,
        rappel: "L’établissement de santé où le patient entre",
      },
    };
  if (sousType.is("2_SORTIE"))
    return {
      depart: {
        nature: ETABLISSEMENT,
        rappel: "L’établissement de santé quitté",
      },
    };
  if (sousType.is("3_ADMISSION_HAD")) return { arrivee: DOMICILE_HAD };
  return {};
}

// Q2.6 option 10 : un départ hospitalier vers le domicile.
function admissionEnHad(): Lieux {
  return {
    depart: {
      nature: ETABLISSEMENT,
      rappel: "L’établissement de santé quitté",
    },
    arrivee: DOMICILE_HAD,
  };
}

// Q2.6 option 8 : un transfert provisoire, qui part de l'établissement
// d'origine et y revient.
function radiotherapie(entrees: Entrees): Lieux {
  if (!q26(entrees, "8_RADIOTHERAPIE")) return {};
  const origine: Etablie = {
    nature: ETABLISSEMENT,
    rappel: "L’établissement d’origine du transfert",
  };
  return retour(entrees) ? { arrivee: origine } : { depart: origine };
}

// L'option 10 de Q2.2.1.b fixe l'arrivée pénitentiaire.
function versLaPrison(): Lieux {
  return {
    arrivee: {
      nature: "6_ETABLISSEMENT_PENITENTIAIRE",
      rappel: "L’établissement pénitentiaire où le patient retourne",
    },
  };
}

// L'établissement et le lieu de séjour, orientés par le sens du document.
function permission(entrees: Entrees): Lieux {
  const acquise =
    entrees.motif.is("11_PERMISSION") || entrees.enPermission.is("1_OUI");
  if (!acquise || sensDe(entrees) === undefined) return {};
  const etablissement: Etablie = {
    nature: ETABLISSEMENT,
    rappel: "L’établissement de santé où le patient séjourne",
  };
  const sejour: Etablie = {
    nature: "1_DOMICILE",
    rappel: "Le lieu de séjour de la permission",
  };
  return retour(entrees)
    ? { depart: sejour, arrivee: etablissement }
    : { depart: etablissement, arrivee: sejour };
}

// L'hébergement est l'arrivée de l'aller, le départ du retour.
function hebergement(entrees: Entrees): Lieux {
  const acquis =
    entrees.motif.is("13_MATERNITE") || entrees.autreCadre.checked("5_HTNM");
  if (!acquis || sensDe(entrees) === undefined) return {};
  const htnm: Etablie = {
    nature: "5_HEBERGEMENT_NON_MEDICALISE",
    rappel: "L’hébergement temporaire non médicalisé",
  };
  return retour(entrees) ? { depart: htnm } : { arrivee: htnm };
}

// Q2.13 nomme le départ d'une entrée. Son autre lieu n'est pas un cabinet.
function departDeQ213(entrees: Entrees): Lieux {
  const depart = entrees.departDeLEntree.value;
  if (depart === undefined) return {};
  const nature = depart === "7_AUTRE_LIEU" ? "8_AUTRE_LIEU" : depart;
  return { depart: { nature, rappel: OPTIONS["Q3.2.nature"][nature] } };
}

// Q1.3 le dit d'un centre : l'aller y arrive, le retour en part.
function dialyse(entrees: Entrees): Lieux {
  if (!entrees.soins.checked("5_DIALYSE")) return {};
  const centre: Etablie = {
    nature: ETABLISSEMENT,
    rappel: "Le centre de dialyse",
  };
  return retour(entrees) ? { depart: centre } : { arrivee: centre };
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

function q26(entrees: Entrees, option: Questions["Q2.6"][number]): boolean {
  return entrees.contexte.checked(option);
}

// L'option 10 de l'autre cadre est cochée (`p2/retour-penitentiaire.ts`).
function retourPenitentiaire({ cadre, autreCadre }: Entrees): boolean {
  return (
    cadre.checked("3_AUTRE_CADRE") &&
    autreCadre.checked("10_RETOUR_PENITENTIAIRE")
  );
}

// Un aller-retour équivalent se décrit dans le sens de l'aller.
function retour(entrees: Entrees): boolean {
  return sensDe(entrees) === "2_RETOUR";
}
