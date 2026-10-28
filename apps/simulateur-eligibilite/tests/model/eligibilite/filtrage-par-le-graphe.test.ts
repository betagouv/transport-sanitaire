// Le filtrage par le graphe (#255) : une question dont la réponse ne change
// rien de ce que montre le résultat ne se pose pas. Ces cas sont les critères
// d'acceptation de l'issue ; `questions-posees-par-seed.test.ts` liste les
// questions posées parcours par parcours.

import { describe, expect, it } from "vitest";
import { model as metier } from "../../../core/models/eligibilite";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import { preconisationOf } from "../../../core/socle/model";
import type { Answers } from "../../../core/socle/questionnaire-engine/question";
import { model } from "../../../front/models/eligibilite";
import { questionnaireOf } from "../../../front/socle/simulateur/questionnaire-of";

type Reponses = Answers<Questions>;

const posees = (reponses: Reponses) => {
  const read = questionnaireOf(model).readWith(reponses);
  return read
    .askedPages()
    .flatMap((page) => read.questionsOn(page).map(({ id }) => id));
};

const preconisation = (reponses: Reponses) =>
  preconisationOf({ ...metier, relevance: model.core.relevance }, reponses);

const DISTANCE = ["Q2.3.1", "Q2.3.2", "Q2.3.3"];

// Un patient seul, pour une consultation, dans un cadre que Q2.2.1.b précise.
const autreCadre = (cadre: Questions["Q2.2.1.b"][number]): Reponses => ({
  "Q0.1": "1_VERIFIER",
  "Q1.1": "1_SEUL",
  "Q1.3": ["7_AUCUNE"],
  "Q1.4": "1_VEHICULE_PERSONNEL",
  "Q2.1": "1_CONSULTATION",
  "Q2.2.1": ["3_AUTRE_CADRE"],
  "Q2.2.1.b": [cadre],
});

// Un patient qu'un professionnel aide, pour une consultation.
const CONSULTATION: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "3_AVEC_UN_PROFESSIONNEL",
  "Q1.2": ["1_PAS_AUTONOME"],
  "Q1.3": ["7_AUCUNE"],
  "Q2.1": "1_CONSULTATION",
  "Q2.2.1": ["4_AUCUNE"],
};

describe("les cadres qui décident sans la distance", () => {
  it.each(["7_SAMSAH", "9_PENSION_MILITAIRE", "5_HTNM"] as const)(
    "%s ne pose ni Q2.3.1, ni Q2.3.2, ni Q2.3.3",
    (cadre) => {
      const questions = posees(autreCadre(cadre));

      expect(questions).toContain("Q2.2.1.b");
      expect(questions.filter((id) => DISTANCE.includes(id))).toEqual([]);
    },
  );

  it("une question sautée ne donne pas « non » : son fait reste absent", () => {
    const { faits } = preconisation(autreCadre("7_SAMSAH"));

    expect(faits.fait_avion_bateau_ligne.value).toBeUndefined();
  });
});

describe("le CAMSP", () => {
  const CAMSP = autreCadre("6_CAMSP");

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
      "Q2.12": "2_NON",
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
