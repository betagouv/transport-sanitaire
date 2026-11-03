// Les situations de P2 qui donnent un rôle aux lieux du trajet : la table de
// QST-LIEUX-001 (`REFERENTIEL/02`), lue dans le sens du document (D-121).
//
// Un rôle fixe la nature d'un lieu, ou la borne à quelques natures. Un séjour
// en établissement fixe l'établissement ; une USLD que Q2.6 cite peut l'être.
// Le lieu de vie d'une permission n'est pas présumé domicile : il se choisit.

import { OPTIONS, type Questions } from "../../catalogue/catalogue.ts";
import type { Entrees, Nature } from "./roles-des-lieux.ts";
import { sensDe } from "./sens-du-trajet.ts";

/** Une nature établie en P2, et ce que le rappel en dit. */
export type Etablie = { readonly nature: Nature; readonly rappel: string };

/** Les natures entre lesquelles P2 laisse choisir. */
type Bornee = { readonly natures: readonly Nature[] };

/** Ce que P2 dit d'un lieu : sa nature, ou les natures qu'il admet. */
export type Role = Etablie | Bornee;

/** Les rôles qu'une situation donne, lieu par lieu. */
export type Lieux = { readonly depart?: Role; readonly arrivee?: Role };

/** Les rôles que chaque situation de P2 donne aux lieux. */
export function rolesDesSituations(entrees: Entrees): Lieux[] {
  return SITUATIONS.map((situation) => situation(entrees));
}

/** Q2.6 cite cette exception de l'article 80. */
export function q26(
  entrees: Entrees,
  option: Questions["Q2.6"][number],
): boolean {
  return entrees.contexte.checked(option);
}

// ---- implémentation ----

const ETABLISSEMENT = "2_ETABLISSEMENT_DE_SANTE";
const DOMICILE_HAD: Etablie = {
  nature: "1_DOMICILE",
  rappel: "Le domicile, pour l’admission en Hospitalisation à Domicile (HAD)",
};
const LIEUX_DE_VIE: readonly Nature[] = [
  "1_DOMICILE",
  "3_EHPAD",
  "5_HEBERGEMENT_NON_MEDICALISE",
  "8_AUTRE_LIEU",
];

const SITUATIONS: readonly ((entrees: Entrees) => Lieux)[] = [
  hospitalisation,
  (entrees) => (q26(entrees, "10_ADMISSION_HAD") ? admissionEnHad() : {}),
  radiotherapie,
  (entrees) => (retourPenitentiaire(entrees) ? versLaPrison() : {}),
  permission,
  deplacementPendantLeSejour,
  soinsPendantLaHad,
  hebergement,
  departDeQ213,
  dialyse,
];

// Q2.1.g : une entrée arrive à l'établissement, une sortie en part. Une
// admission en HAD arrive au domicile, et ne part de l'établissement que si
// le patient y séjourne (TS1014-E06).
function hospitalisation(entrees: Entrees): Lieux {
  const sousType = entrees.sousType;
  if (sousType.is("1_ENTREE"))
    return {
      arrivee: hopital(entrees, "L’établissement de santé où le patient entre"),
    };
  if (sousType.is("2_SORTIE"))
    return { depart: hopital(entrees, "L’établissement de santé quitté") };
  if (!sousType.is("3_ADMISSION_HAD")) return {};
  return sejourEnEtablissement(entrees)
    ? {
        depart: hopital(entrees, "L’établissement de santé quitté"),
        arrivee: DOMICILE_HAD,
      }
    : { arrivee: DOMICILE_HAD };
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

// L'option 10 de Q2.2.1 fixe l'arrivée pénitentiaire.
function versLaPrison(): Lieux {
  return {
    arrivee: {
      nature: "6_ETABLISSEMENT_PENITENTIAIRE",
      rappel: "L’établissement pénitentiaire où le patient retourne",
    },
  };
}

// L'établissement et le lieu de vie, orientés par le sens du document. Le lieu
// de vie se choisit ; la prison s'y ajoute pour un retour pénitentiaire, qui
// part toujours de l'établissement vers elle (TS1014-E05).
function permission(entrees: Entrees): Lieux {
  const acquise =
    entrees.motif.is("11_PERMISSION") || entrees.enPermission.is("1_OUI");
  if (!acquise || sensDe(entrees) === undefined) return {};
  const etablissement = hopital(
    entrees,
    "L’établissement de santé où le patient séjourne",
  );
  if (retourPenitentiaire(entrees))
    return {
      depart: etablissement,
      arrivee: { natures: [...LIEUX_DE_VIE, "6_ETABLISSEMENT_PENITENTIAIRE"] },
    };
  const lieuDeVie: Bornee = { natures: LIEUX_DE_VIE };
  return retour(entrees)
    ? { depart: lieuDeVie, arrivee: etablissement }
    : { depart: etablissement, arrivee: lieuDeVie };
}

// Q2.5 = 2 pendant un séjour en établissement : l'aller en part, le retour y
// revient. Une admission en HAD de Q2.6 n'y revient pas : elle quitte
// l'établissement pour le domicile (D-256).
function deplacementPendantLeSejour(entrees: Entrees): Lieux {
  const autre = entrees.transfert.is("2_AUTRE_DEPLACEMENT");
  if (!autre || !sejourEnEtablissement(entrees)) return {};
  if (q26(entrees, "10_ADMISSION_HAD")) return {};
  if (sensDe(entrees) === undefined) return {};
  const sejour = hopital(
    entrees,
    "L’établissement de santé où le patient séjourne",
  );
  return retour(entrees) ? { arrivee: sejour } : { depart: sejour };
}

// Un séjour en HAD : l'aller part du domicile, le retour y revient. Aucun
// établissement ne s'en déduit.
function soinsPendantLaHad(entrees: Entrees): Lieux {
  const enHad =
    entrees.situations.checked("1_HOSPITALISATION") &&
    entrees.sejour.is("2_HAD");
  if (!enHad || sensDe(entrees) === undefined) return {};
  const domicile: Etablie = {
    nature: "1_DOMICILE",
    rappel: "Le domicile, pendant l’Hospitalisation à Domicile (HAD)",
  };
  return retour(entrees) ? { arrivee: domicile } : { depart: domicile };
}

// L'hébergement est l'arrivée de l'aller, le départ du retour.
function hebergement(entrees: Entrees): Lieux {
  const acquis =
    entrees.motif.is("13_MATERNITE") || entrees.situations.checked("5_HTNM");
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

// L'établissement d'un séjour. Une USLD que Q2.6 cite peut l'être : la nature
// se choisit alors entre les deux (TS1014-E08).
function hopital(entrees: Entrees, rappel: string): Role {
  return q26(entrees, "6_USLD")
    ? { natures: [ETABLISSEMENT, "4_USLD"] }
    : { nature: ETABLISSEMENT, rappel };
}

// « Déjà hospitalisé » coché, dans un établissement de santé
// (`p2/sejour.ts`).
function sejourEnEtablissement(entrees: Entrees): boolean {
  return (
    entrees.situations.checked("1_HOSPITALISATION") &&
    (entrees.sejour.is("1_ETABLISSEMENT") || entrees.sousType.is("2_SORTIE"))
  );
}

// L'option 10 de Q2.2.1 est cochée (`p2/retour-penitentiaire.ts`).
function retourPenitentiaire({ situations }: Entrees): boolean {
  return situations.checked("10_RETOUR_PENITENTIAIRE");
}

// Un aller-retour équivalent se décrit dans le sens de l'aller.
function retour(entrees: Entrees): boolean {
  return sensDe(entrees) === "2_RETOUR";
}
