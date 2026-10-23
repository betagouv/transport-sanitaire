// Les deux lieux du trajet de P3 (Q3.2, Q3.3) : ce que P2 en établit déjà, et
// la case du cerfa où chacun se reporte.
//
// P2 fixe la nature d'un lieu par le motif du trajet, ses contextes ou Q2.13
// (`roles-des-lieux.ts`). Elle ne se redemande pas : le lieu se rappelle, et
// seuls son nom et son adresse se saisissent.

import type { GivenAnswers, ValidatedAnswers } from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";
import type { Inconnu } from "../question.ts";
import {
  type Etablie,
  type Extremite,
  lieuxEtablis,
  type Nature,
} from "./roles-des-lieux.ts";

export type { Extremite, Nature };

/** La case du cerfa où se reporte un lieu : le gabarit n'en a que trois. */
export type Projection = "DOMICILE" | "STRUCTURE_DE_SOINS" | "AUTRE_LIEU";

type Reponses = GivenAnswers<Questions>;

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
  reponses: Reponses,
): Etablie | NonEtablie {
  return lieuxEtablis(reponses)[extremite];
}

/** La nature du lieu : établie en P2, ou choisie plus tôt en P3. */
export function natureDu(
  extremite: Extremite,
  reponses: Reponses,
  validated: ValidatedAnswers<Questions>,
): Nature | Inconnu {
  const choisie = validated.question(QUESTIONS_DU_LIEU[extremite].nature).value;
  return natureEtablie(extremite, reponses)?.nature ?? choisie;
}

/**
 * La nature s'écrit-elle en toutes lettres sur le cerfa ? Un hébergement ou un
 * autre lieu y porte sa nature (`CONTRAT_LIEUX_CERFA.json`). Seul l'hébergement
 * que P2 établit, le HTNM, la donne déjà.
 */
export function precisionAPoser(
  extremite: Extremite,
  reponses: Reponses,
  validated: ValidatedAnswers<Questions>,
): boolean {
  const nature = natureDu(extremite, reponses, validated);
  if (nature === "8_AUTRE_LIEU") return true;
  return (
    nature === "5_HEBERGEMENT_NON_MEDICALISE" &&
    natureEtablie(extremite, reponses) === undefined
  );
}

/** Q2.2.5 situe-t-elle ce lieu à l'étranger ? Q3.2 et Q3.3 ne le découvrent pas. */
export function aLEtranger(extremite: Extremite, reponses: Reponses): boolean {
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
