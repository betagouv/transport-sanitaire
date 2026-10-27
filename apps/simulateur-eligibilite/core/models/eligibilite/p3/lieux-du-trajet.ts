// Les deux lieux du trajet de P3 (Q3.2, Q3.3) : ce que P2 en établit déjà, et
// la case du cerfa où chacun se reporte.
//
// P2 fixe la nature d'un lieu par le motif du trajet, ses contextes ou Q2.13
// (`roles-des-lieux.ts`). Elle ne se redemande pas : le lieu se rappelle, et
// seuls son nom et son adresse se saisissent.

import type { Condition, GivenAnswers, Value } from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";
import { given, type Inconnu } from "../question.ts";
import {
  ENTREES_DES_LIEUX,
  type Entrees,
  type Etablie,
  type Extremite,
  lieuxEtablis,
  type Nature,
} from "./roles-des-lieux.ts";

export type { Entrees, Extremite, Nature };

/** La case du cerfa où se reporte un lieu : le gabarit n'en a que trois. */
export type Projection = "DOMICILE" | "STRUCTURE_DE_SOINS" | "AUTRE_LIEU";

/** Les questions de chaque lieu. */
export const QUESTIONS_DU_LIEU = {
  depart: {
    nature: "Q3.2.nature",
    nom: "Q3.2.nom",
    precision: "Q3.2.precision",
    adresse: "Q3.2.adresse",
  },
  arrivee: {
    nature: "Q3.3.nature",
    nom: "Q3.3.nom",
    precision: "Q3.3.precision",
    adresse: "Q3.3.adresse",
  },
} as const;

/** P2 ne fixe pas la nature du lieu : elle se choisit en P3. */
type NonEtablie = undefined;

/** La nature que P2 établit pour ce lieu. Absente : elle se choisit en P3. */
export function natureEtablie(
  extremite: Extremite,
  entrees: Entrees,
): Etablie | NonEtablie {
  return lieuxEtablis(entrees)[extremite];
}

/** La nature que P2 établit pour ce lieu, telle que l'endroit la lit. */
export function natureEtablieDu(
  extremite: Extremite,
): Value<Etablie | NonEtablie> {
  return ENTREES_DES_LIEUX.compute((entrees) =>
    natureEtablie(extremite, entrees),
  );
}

/** La nature du lieu : établie en P2, ou choisie plus tôt en P3. */
export function natureDu(extremite: Extremite): Value<Nature | Inconnu> {
  return natureEtChoix(extremite).compute(
    ({ etablie, choisie }) => etablie?.nature ?? choisie.value,
  );
}

/**
 * La nature s'écrit-elle en toutes lettres sur le cerfa ? Un hébergement ou un
 * autre lieu y porte sa nature (`CONTRAT_LIEUX_CERFA.json`). Seul l'hébergement
 * que P2 établit, le HTNM, la donne déjà.
 */
export function precisionAPoser(extremite: Extremite): Condition {
  return natureEtChoix(extremite).compute(({ etablie, choisie }) => {
    const nature = etablie?.nature ?? choisie.value;
    if (nature === "8_AUTRE_LIEU") return true;
    return nature === "5_HEBERGEMENT_NON_MEDICALISE" && etablie === undefined;
  });
}

/** Q2.2.5 situe-t-elle ce lieu à l'étranger ? Q3.2 et Q3.3 ne le découvrent pas. */
export function aLEtranger(
  extremite: Extremite,
  reponses: GivenAnswers<Questions>,
): boolean {
  const lieu = extremite === "depart" ? "1_DEPART" : "2_ARRIVEE";
  return reponses.question("Q2.2.5").checked(lieu);
}

/**
 * La case du cerfa de cette nature, selon la convention validée par l'éditeur
 * (`CONTRAT_LIEUX_CERFA.json`, point 39).
 */
export function projectionCerfa(nature: Nature): Projection {
  return PROJECTIONS[nature];
}

// ---- implémentation ----

// La nature que P2 établit, et celle choisie à Q3.x.nature.
function natureEtChoix(extremite: Extremite) {
  return given.all({
    etablie: natureEtablieDu(extremite),
    choisie: given.question(QUESTIONS_DU_LIEU[extremite].nature).answer(),
  });
}

const PROJECTIONS: Record<Nature, Projection> = {
  "1_DOMICILE": "DOMICILE",
  "2_ETABLISSEMENT_DE_SANTE": "STRUCTURE_DE_SOINS",
  "3_EHPAD": "AUTRE_LIEU",
  "4_USLD": "STRUCTURE_DE_SOINS",
  "5_HEBERGEMENT_NON_MEDICALISE": "AUTRE_LIEU",
  "6_ETABLISSEMENT_PENITENTIAIRE": "AUTRE_LIEU",
  "7_CABINET": "STRUCTURE_DE_SOINS",
  "8_AUTRE_LIEU": "AUTRE_LIEU",
};
