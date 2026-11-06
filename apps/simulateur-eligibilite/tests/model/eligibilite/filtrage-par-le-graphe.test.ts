// Le filtrage par le graphe (#255) : une question dont la réponse ne change
// rien de ce que montre le résultat ne se pose pas. Ces cas sont les critères
// d'acceptation de l'issue, et le second bloc des situations (D-252) ;
// `questions-posees-par-seed.test.ts` liste les questions posées parcours par
// parcours.

import { describe, expect, it } from "vitest";
import { model as metier } from "../../../core/models/eligibilite";
import type { Questions } from "../../../core/models/eligibilite/questions/reponses";
import type { Answers } from "../../../core/socle/questionnaire-engine";
import { preconisationOf, Simulation } from "../../../core/socle/simulation";

import { model } from "../../../front/models/eligibilite";

type Reponses = Answers<Questions>;

const posees = (reponses: Reponses) => {
  const simulation = Simulation.resume(model.core, reponses);
  return simulation
    .pages()
    .flatMap((page) => simulation.questionsOn(page).map(({ id }) => id));
};

const preconisation = (reponses: Reponses) =>
  preconisationOf({ ...metier, relevance: model.core.relevance }, reponses);

const DISTANCE = ["Q2.3.1", "Q2.3.2", "Q2.3.3"];

// Un patient seul, pour une consultation, sans situation particulière.
const SEUL: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "1_SEUL",
  "Q1.3": ["7_AUCUNE"],
  "Q1.4": "1_VEHICULE_PERSONNEL",
  "Q2.1": "1_CONSULTATION",
  "Q2.2.1": ["0_AUCUNE"],
  "Q2.2.1.b": ["0_AUCUN"],
};

// Le même, avec des soins que Q2.2.1.b dit.
const avecDesSoins = (soin: Questions["Q2.2.1.b"][number]): Reponses => ({
  ...SEUL,
  "Q2.2.1.b": [soin],
});

// Un patient qu'un professionnel aide, pour une consultation.
const CONSULTATION: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "3_AVEC_UN_PROFESSIONNEL",
  "Q1.2": ["1_PAS_AUTONOME"],
  "Q1.3": ["7_AUCUNE"],
  "Q2.1": "1_CONSULTATION",
  "Q2.2.1": ["0_AUCUNE"],
  "Q2.2.1.b": ["0_AUCUN"],
};

describe("les cadres qui décident sans la distance", () => {
  it.each([
    ["7_SAMSAH", avecDesSoins("7_SAMSAH")],
    ["9_PENSION_MILITAIRE", avecDesSoins("9_PENSION_MILITAIRE")],
    ["5_HTNM", { ...SEUL, "Q2.2.1": ["5_HTNM"] }],
  ] as const)("%s ne pose ni Q2.3.1, ni Q2.3.2, ni Q2.3.3", (_, reponses) => {
    const questions = posees(reponses);

    expect(questions).toContain("Q2.2.1");
    expect(questions.filter((id) => DISTANCE.includes(id))).toEqual([]);
  });

  it("une question sautée ne donne pas « non » : son fait reste absent", () => {
    const { faits } = preconisation(avecDesSoins("7_SAMSAH"));

    expect(faits.fait_avion_bateau_ligne.value).toBeUndefined();
  });
});

describe("le CAMSP", () => {
  const CAMSP = avecDesSoins("6_CAMSP");

  it("pose Q2.3.1 et Q2.3.2, sans Q2.3.3 à 50 km ou moins", () => {
    const reponses: Reponses = {
      ...CAMSP,
      "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
      "Q2.3.2": false,
    };

    expect(posees(reponses).filter((id) => DISTANCE.includes(id))).toEqual([
      "Q2.3.1",
      "Q2.3.2",
    ]);
  });

  it("pose Q2.3.3 au-delà de 150 km, et la DAP coche la longue distance et la série", () => {
    const reponses: Reponses = {
      ...CAMSP,
      "Q2.3.1": "3_PLUS_DE_CENT_CINQUANTE_KM",
      "Q2.3.2": false,
      "Q2.3.3": "1_OUI",
      "Q2.3.4": "2_NON",
    };
    const { cibles } = preconisation(reponses);

    expect(posees(reponses)).toContain("Q2.3.3");
    expect(cibles.cible_support_id.value).toBe("S3139h");
    expect(cibles.cible_dap_motif_longue_distance.value).toBe(true);
    expect(cibles.cible_dap_motif_serie.value).toBe(true);
  });
});

describe("la distance d'une consultation", () => {
  it("à 80 km, pose Q2.3.3", () => {
    const reponses: Reponses = {
      ...CONSULTATION,
      "Q2.3.1": "2_PLUS_DE_CINQUANTE_KM",
      "Q2.3.2": false,
    };

    expect(posees(reponses)).toContain("Q2.3.3");
  });

  it("pose Q2.3.2 : l'avion ou le bateau de ligne change le document", () => {
    const court: Reponses = {
      ...CONSULTATION,
      "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
    };
    const enAvion = preconisation({ ...court, "Q2.3.2": true }).cibles;
    const parLaRoute = preconisation({ ...court, "Q2.3.2": false }).cibles;

    expect(posees(court)).toContain("Q2.3.2");
    expect(enAvion.cible_support_id.value).not.toBe(
      parLaRoute.cible_support_id.value,
    );
  });
});

// Le second bloc des situations (P2/soins, D-252) : le graphe le saute quand
// plus rien de ce qu'il établit ne compte. Ses soins changent presque toujours
// l'issue ou sa raison, et la convocation qu'il signale ouvre Q2.10 : il se
// pose donc. Les cas « Deux groupes » et « Contextes » des compléments de
// recette (#149).
describe("le second bloc des situations", () => {
  const { "Q2.2.1.b": _, ...SANS_SECOND_BLOC } = SEUL;

  it("se pose après « Non, aucune » au premier bloc", () => {
    expect(posees(SANS_SECOND_BLOC)).toContain("Q2.2.1.b");
  });

  // L'HTNM renvoie à la caisse sans la distance ; le SAMSAH change la raison
  // qu'en donne le résultat.
  it("se pose encore quand le premier bloc décide sans la distance", () => {
    const htnm: Reponses = { ...SANS_SECOND_BLOC, "Q2.2.1": ["5_HTNM"] };
    const raison = (soin: Questions["Q2.2.1.b"][number]) =>
      preconisation({ ...htnm, "Q2.2.1.b": [soin] }).cibles.cible_reason_code
        .value;

    expect(posees(htnm)).toContain("Q2.2.1.b");
    expect(raison("0_AUCUN")).toBe("CNAM_HTNM_HORS_MATERNITE");
    expect(raison("7_SAMSAH")).toBe("SAMSAH_DAP_SUPPORT_A_QUALIFIER");
  });
});
