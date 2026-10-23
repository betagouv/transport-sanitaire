// Ce que P2 établit des deux lieux du trajet : la matrice des lieux du
// catalogue (« Contrat des lieux et des segments », Q2.13, Q3.3), lue dans le
// sens que Q3.1.2 ou Q2.8 donne (D-121).
//
// Une nature établie se rappelle sans se redemander. Une nature que P2 borne
// sans la fixer, comme les deux bouts d'un transfert, se choisit parmi celles
// qu'elle permet.

import type { GivenAnswers } from "../../../socle/index.ts";
import { RetourPenitentiaire } from "../concepts/retour-penitentiaire.ts";
import { OPTIONS, type Questions } from "../declarations/questions.ts";
import { sensDuDocument } from "./sens-du-trajet.ts";

export type Extremite = "depart" | "arrivee";

/** La nature d'un lieu, du domicile à l'autre lieu. */
export type Nature = keyof (typeof OPTIONS)["Q3.2.nature"];

/** Une nature établie en P2, et ce que le rappel en dit. */
export type Etablie = { readonly nature: Nature; readonly rappel: string };

/** Les natures que P2 établit, lieu par lieu. */
type Lieux = { readonly depart?: Etablie; readonly arrivee?: Etablie };

type Reponses = GivenAnswers<Questions>;

/**
 * Les lieux que P2 établit. Chaque situation donne ses lieux ; la première qui
 * établit un lieu le fixe.
 */
export function lieuxEtablis(reponses: Reponses): Lieux {
  const lieux = SITUATIONS.map((situation) => situation(reponses));
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
  reponses: Reponses,
  autre: Nature | undefined,
): boolean {
  if (nature === "1_DOMICILE" && autre === "1_DOMICILE") return false;
  if (!dansLeTransfert(nature, reponses)) return false;
  if (extremite === "depart" && autre === undefined) return true;
  const manquantes = naturesRequises(reponses).filter((n) => n !== autre);
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
const SITUATIONS: readonly ((reponses: Reponses) => Lieux)[] = [
  hospitalisation,
  (reponses) => (q26(reponses, "10_ADMISSION_HAD") ? admissionEnHad() : {}),
  radiotherapie,
  (reponses) =>
    RetourPenitentiaire.of(reponses).estCoche() ? retourPenitentiaire() : {},
  permission,
  hebergement,
  departDeQ213,
  dialyse,
];

// Q2.1.g : une entrée arrive à l'établissement, une sortie en part, une
// admission en HAD arrive au domicile.
function hospitalisation(reponses: Reponses): Lieux {
  const sousType = reponses.question("Q2.1.g");
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
function radiotherapie(reponses: Reponses): Lieux {
  if (!q26(reponses, "8_RADIOTHERAPIE")) return {};
  const origine: Etablie = {
    nature: ETABLISSEMENT,
    rappel: "L’établissement d’origine du transfert",
  };
  return retour(reponses) ? { arrivee: origine } : { depart: origine };
}

// L'option 10 de Q2.2.1.b fixe l'arrivée pénitentiaire.
function retourPenitentiaire(): Lieux {
  return {
    arrivee: {
      nature: "6_ETABLISSEMENT_PENITENTIAIRE",
      rappel: "L’établissement pénitentiaire où le patient retourne",
    },
  };
}

// L'établissement et le lieu de séjour, orientés par le sens du document.
function permission(reponses: Reponses): Lieux {
  const acquise =
    reponses.question("Q2.1").is("11_PERMISSION") ||
    reponses.question("Q2.2.1.a").is("1_OUI");
  if (!acquise || sensDuDocument(reponses) === undefined) return {};
  const etablissement: Etablie = {
    nature: ETABLISSEMENT,
    rappel: "L’établissement de santé où le patient séjourne",
  };
  const sejour: Etablie = {
    nature: "1_DOMICILE",
    rappel: "Le lieu de séjour de la permission",
  };
  return retour(reponses)
    ? { depart: sejour, arrivee: etablissement }
    : { depart: etablissement, arrivee: sejour };
}

// L'hébergement est l'arrivée de l'aller, le départ du retour.
function hebergement(reponses: Reponses): Lieux {
  const acquis =
    reponses.question("Q2.1").is("13_MATERNITE") ||
    reponses.question("Q2.2.1.b").checked("5_HTNM");
  if (!acquis || sensDuDocument(reponses) === undefined) return {};
  const htnm: Etablie = {
    nature: "5_HEBERGEMENT_NON_MEDICALISE",
    rappel: "L’hébergement temporaire non médicalisé",
  };
  return retour(reponses) ? { depart: htnm } : { arrivee: htnm };
}

// Q2.13 nomme le départ d'une entrée. Son autre lieu n'est pas un cabinet.
function departDeQ213(reponses: Reponses): Lieux {
  const depart = reponses.question("Q2.13.depart").value;
  if (depart === undefined) return {};
  const nature = depart === "7_AUTRE_LIEU" ? "8_AUTRE_LIEU" : depart;
  return { depart: { nature, rappel: OPTIONS["Q3.2.nature"][nature] } };
}

// Q1.3 le dit d'un centre : l'aller y arrive, le retour en part.
function dialyse(reponses: Reponses): Lieux {
  if (!reponses.question("Q1.3").checked("5_DIALYSE")) return {};
  const centre: Etablie = {
    nature: ETABLISSEMENT,
    rappel: "Le centre de dialyse",
  };
  return retour(reponses) ? { depart: centre } : { arrivee: centre };
}

// Un transfert entre établissements n'a que des établissements pour lieux, une
// radiothérapie en ville un centre ou un cabinet face à l'origine.
function dansLeTransfert(nature: Nature, reponses: Reponses): boolean {
  if (q26(reponses, "8_RADIOTHERAPIE"))
    return LIEUX_DE_RADIOTHERAPIE.includes(nature);
  if (reponses.question("Q2.5").is("1_TRANSFERT"))
    return ETABLISSEMENTS.includes(nature);
  return true;
}

// L'USLD et l'EHPAD que Q2.6 cite : l'un des deux lieux en est un. Avec une
// radiothérapie en ville, c'est l'établissement d'origine, que P2 fixe.
function naturesRequises(reponses: Reponses): Nature[] {
  if (q26(reponses, "8_RADIOTHERAPIE")) return [];
  return [
    ...(q26(reponses, "6_USLD") ? (["4_USLD"] as const) : []),
    ...(q26(reponses, "7_EHPAD") ? (["3_EHPAD"] as const) : []),
  ];
}

function q26(reponses: Reponses, option: Questions["Q2.6"][number]): boolean {
  return reponses.question("Q2.6").checked(option);
}

// Un aller-retour équivalent se décrit dans le sens de l'aller.
function retour(reponses: Reponses): boolean {
  return sensDuDocument(reponses) === "2_RETOUR";
}
