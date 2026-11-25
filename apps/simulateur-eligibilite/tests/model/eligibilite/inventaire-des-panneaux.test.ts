// L'inventaire des panneaux de l'éditeur (`12_INVENTAIRE_PANNEAUX_10_2_1.md`,
// v10.2.1), ligne à ligne, rapporté aux questions du modèle. Une ligne
// conditionnelle s'affiche sous les réponses qu'elle nomme ; une ligne autonome
// ou composée, à son rang. Aucune question du modèle, ni aucune de ses places,
// n'est hors de l'inventaire, sauf celles que la table EN_PLUS dit.

import { describe, expect, it } from "vitest";
import { COMPLEMENT } from "../../../core/models/eligibilite/questions/p3/partie-3.constants";
import { PARTS } from "../../../core/models/eligibilite/questions/questionnaire.constants";
import type { ShownUnder } from "../../../core/socle/questionnaire-engine";

/** Une ligne de l'inventaire, dans le modèle. */
type Ligne =
  | { readonly autonome: readonly string[] }
  | { readonly sous: readonly string[]; readonly questions: readonly string[] }
  | { readonly aSonRang: readonly string[]; readonly raison: string }
  | { readonly absente: string };

const INACTIVE = { absente: "inactive à l'inventaire" };
const HORS_P2 = { absente: "ne se pose pas" };
const LIEU = (q: "Q3.2" | "Q3.3", categorie: string) =>
  `${q}.categorie:${categorie}`;

// Les 63 lignes de l'inventaire, dans son ordre.
const INVENTAIRE: Readonly<Record<string, Ligne>> = {
  "Q0.1": { autonome: ["Q0.1"] },
  "Q1.1": { autonome: ["Q1.1"] },
  "Q1.2": { autonome: ["Q1.2"] },
  "Q1.3": { autonome: ["Q1.3"] },
  "Q1.3.b": { sous: ["Q1.3:2_ALD"], questions: ["Q1.3.b"] },
  "Q1.4": { autonome: ["Q1.4"] },
  "Q2.1": { autonome: ["Q2.1"] },
  "Q2.2.1": { autonome: ["Q2.2.1"] },
  "Q2.2.1.a": { sous: ["Q2.2.1:1_HOSPITALISATION"], questions: ["Q2.2.1.a"] },
  "Q2.2.1.b": { autonome: ["Q2.2.1.b"] },
  "Q2.2.2": HORS_P2,
  "Q2.2.3": HORS_P2,
  "Q2.2.4": HORS_P2,
  "Q2.2.5": { sous: ["Q2.2.1:2_ETRANGER"], questions: ["Q2.2.5"] },
  "Q2.3.1": { autonome: ["Q2.3.1"] },
  "Q2.3.1.finalite": {
    sous: ["Q2.3.1:3_PLUS_DE_CENT_CINQUANTE_KM"],
    questions: ["Q2.3.1.finalite"],
  },
  "Q2.3.2": { autonome: ["Q2.3.2"] },
  "Q2.3.3": {
    sous: [
      "Q2.3.1:2_PLUS_DE_CINQUANTE_KM",
      "Q2.3.1:3_PLUS_DE_CENT_CINQUANTE_KM",
    ],
    questions: ["Q2.3.3"],
  },
  // Le CAMSP ou le CMPP se coche sur une autre page : pas de place.
  "Q2.3.4": {
    sous: [
      "Q2.3.1:2_PLUS_DE_CINQUANTE_KM",
      "Q2.3.1:3_PLUS_DE_CENT_CINQUANTE_KM",
      "Q2.3.2",
      "Q2.14.eloignement:1_PLUS_DE_QUARANTE_CINQ_MINUTES",
      "Q2.14.eloignement:2_COMMUNE_DESIGNEE_PAR_L_ARS",
      "Q2.14.motif:2_HEBERGEMENT_ENGAGEMENT",
    ],
    questions: ["Q2.3.4"],
  },
  "Q2.5": { autonome: ["Q2.5"] },
  "Q2.6": { autonome: ["Q2.6.a", "Q2.6"] },
  "Q2.7": { autonome: ["Q2.7"] },
  "Q2.8": {
    autonome: [
      ...["Q2.8.1", "Q2.8.2", "Q2.8.3", "Q2.8.4", "Q2.8.5"],
      ...["Q2.8.6", "Q2.8.6.a", "Q2.8.6.b"],
    ],
  },
  "Q2.10": { autonome: ["Q2.10"] },
  "Q2.13": { autonome: ["Q2.13.depart", "Q2.13.sens"] },
  "Q2.14": { autonome: ["Q2.14.eloignement", "Q2.14.motif"] },
  "Q3.1": { autonome: ["Q3.1.2", "Q3.1.3"] },
  "Q3.2": { autonome: ["Q3.2.categorie", "Q3.2.adresse"] },
  "Q3.3": { autonome: ["Q3.3.categorie", "Q3.3.adresse"] },
  "Q3.4": { autonome: ["Q3.4.distance"] },
  "Q3.4.a": { autonome: ["Q3.4.a"] },
  "Q3.5": { autonome: ["Q3.5"] },
  "Q2.14.trajet": { autonome: ["Q2.14.trajet"] },
  "Q3.6": { autonome: ["Q3.6.1"] },
  "Q3.7": { autonome: ["Q3.7"] },
  "Q3.8": {
    autonome: [
      ...["Q3.8.maternite.nom", "Q3.8.maternite.adresse", "Q3.8.niveau"],
      ...["Q3.8.hebergement.nom", "Q3.8.hebergement.adresse"],
    ],
  },
  "Q2.1.a": INACTIVE,
  "Q2.1.b": INACTIVE,
  "Q2.1.c": INACTIVE,
  "Q2.1.d": INACTIVE,
  "Q2.1.e": INACTIVE,
  "Q2.1.f": {
    aSonRang: ["Q2.1.f"],
    raison: "les séances se disent en P1, pas sur sa page",
  },
  "Q2.1.g": { sous: ["Q2.1:8_HOSPITALISATION"], questions: ["Q2.1.g"] },
  "Q2.1.h": { absente: "sortie du questionnaire" },
  "Q2.1.i": INACTIVE,
  "Q2.1.j": INACTIVE,
  "Q2.1.k": INACTIVE,
  "Q2.1.l": INACTIVE,
  "Q1.3.a": { sous: ["Q1.3:5_DIALYSE"], questions: ["Q1.3.a"] },
  "Q2.7.a": { sous: ["Q2.7:4_ADULTE_A_SA_CHARGE"], questions: ["Q2.7.a"] },
  "Q2.10.a": { sous: ["Q2.10:6_APPAREILLAGE"], questions: ["Q2.10.a"] },
  "Q2.10.b": { sous: ["Q2.10:6_APPAREILLAGE"], questions: ["Q2.10.b"] },
  "Q2.12": { absente: "alias de Q2.3.1 à Q2.3.4, sans écran" },
  hospitalStayQuestion: {
    sous: ["Q2.2.1:1_HOSPITALISATION"],
    questions: ["Q2.2.1.cadre"],
  },
  "Q2.2.1.prison-medical": {
    sous: ["Q2.2.1:10_RETOUR_PENITENTIAIRE"],
    questions: ["Q2.2.1.indication"],
  },
  "Q2.3.2.terrestre": { sous: ["Q2.3.2"], questions: ["Q2.3.2.terrestre"] },
  "Q1.3.accident_tiers_date": {
    sous: ["Q1.3:9_ACCIDENT_TIERS"],
    questions: ["Q1.3.accident_tiers_date"],
  },
  "Q2.8.duree_48h": {
    aSonRang: ["Q2.8.duree_48h"],
    raison: "sa garde ne lit pas les dates, aucune ne l'ouvre",
  },
  "Q3.1.quantity": {
    sous: ["1_ALLER", "2_RETOUR", "3_ALLER_RETOUR_EQUIVALENT"].map(
      (sens) => `Q3.1.2:${sens}`,
    ),
    questions: ["Q3.1.1"],
  },
  ...lieu("Q3.2"),
  ...lieu("Q3.3"),
};

// Ce que le modèle pose en plus de l'inventaire.
const EN_PLUS: Readonly<Record<string, Ligne>> = {
  "côté de l'USLD ou de l'EHPAD": {
    sous: [LIEU("Q3.3", "2_STRUCTURE_DE_SOINS"), LIEU("Q3.3", "3_AUTRE_LIEU")],
    questions: ["Q3.lieux.usld.cote", "Q3.lieux.ehpad.cote"],
  },
};

describe("l'inventaire des panneaux", () => {
  it("a ses 63 lignes", () => {
    expect(Object.keys(INVENTAIRE)).toHaveLength(63);
  });

  it("pose chaque question conditionnelle sous les réponses qu'il nomme", () => {
    for (const ligne of lignes())
      if ("sous" in ligne)
        for (const id of ligne.questions)
          expect(placesDe(id), id).toEqual(
            expect.arrayContaining([...ligne.sous]),
          );
  });

  it("ne donne aucune place qu'il ne nomme pas", () => {
    const nommees = lignes().flatMap((ligne) =>
      "sous" in ligne
        ? ligne.questions.flatMap((id) => ligne.sous.map((p) => `${id}<${p}`))
        : [],
    );
    const declarees = [...MODELE].flatMap(([id, places]) =>
      places.map((p) => `${id}<${p}`),
    );

    expect(new Set(declarees)).toEqual(new Set(nommees));
  });

  it("pose à leur rang les questions autonomes", () => {
    for (const ligne of lignes())
      for (const id of "autonome" in ligne
        ? ligne.autonome
        : "aSonRang" in ligne
          ? ligne.aSonRang
          : [])
        expect(placesDe(id), id).toEqual([]);
  });

  it("n'oublie aucune question du modèle", () => {
    const inventoriees = lignes().flatMap(questionsDe);

    expect(new Set(MODELE.keys())).toEqual(new Set(inventoriees));
  });
});

// ---- implémentation ----

type PageDeclaree = {
  readonly questions: readonly {
    readonly id: string;
    readonly places: readonly ShownUnder[];
  }[];
};

// Les places déclarées de chaque question du modèle, `question:réponse`.
const MODELE = new Map<string, readonly string[]>(
  [...PARTS, COMPLEMENT]
    .flatMap(({ pages }): readonly PageDeclaree[] => pages)
    .flatMap(({ questions }) => questions)
    .map(({ id, places }) => [
      id,
      places.map(({ question, possibleAnswer }) =>
        possibleAnswer ? `${question}:${possibleAnswer}` : question,
      ),
    ]),
);

function placesDe(id: string): readonly string[] {
  const places = MODELE.get(id);
  if (!places) throw new Error(`${id} n'est pas une question du modèle.`);
  return places;
}

function lignes(): readonly Ligne[] {
  return [...Object.values(INVENTAIRE), ...Object.values(EN_PLUS)];
}

function questionsDe(ligne: Ligne): readonly string[] {
  if ("autonome" in ligne) return ligne.autonome;
  if ("aSonRang" in ligne) return ligne.aSonRang;
  if ("questions" in ligne) return ligne.questions;
  return [];
}

// Un lieu : son nom et son service sous la structure de soins ; sa nature, sa
// précision et son nom sous un autre lieu. L'adresse reste hors du panneau.
function lieu(q: "Q3.2" | "Q3.3"): Record<string, Ligne> {
  return {
    [`${q}.structure`]: {
      sous: [LIEU(q, "2_STRUCTURE_DE_SOINS")],
      questions: [`${q}.nom`, `${q}.service`],
    },
    [`${q}.other`]: {
      sous: [LIEU(q, "3_AUTRE_LIEU")],
      questions: [`${q}.nature`, `${q}.precision`, `${q}.nom`],
    },
  };
}
