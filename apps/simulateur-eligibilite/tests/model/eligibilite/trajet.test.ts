// La page du trajet de P2 : ce qui s'y pose, d'après le catalogue de
// l'éditeur. La série se révèle sur la même page, sous la distance.

import { describe, expect, it } from "vitest";
import { model } from "../../../front/models/eligibilite";
import type { Questions } from "../../../front/models/eligibilite/declarations/questions";
import { askedQuestions } from "../../../front/socle/questionnaire-engine/asked-questions";
import {
  type Answers,
  pagesOf,
} from "../../../front/socle/questionnaire-engine/question";

type Reponses = Answers<Questions>;

const pages = pagesOf(model.transportAndEligibility.parts);
const page = pages.find(({ id }) => id === "P2/trajet");
const posees = (reponses: Reponses) =>
  page ? askedQuestions(pages, page, reponses).map(({ id }) => id) : [];

const SEUL: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "1_SEUL",
  "Q1.3": ["7_AUCUNE"],
  "Q1.4": "1_VEHICULE_PERSONNEL",
};

describe("la page du trajet", () => {
  it("demande d'abord la distance", () => {
    expect(posees(SEUL)).toEqual(["Q2.3.1"]);
  });

  it.each(["2_PLUS_DE_CINQUANTE_KM", "3_PLUS_DE_CENT_CINQUANTE_KM"] as const)(
    "pose la série pour un trajet de %s",
    (distance) => {
      expect(posees({ ...SEUL, "Q2.3.1": distance })).toEqual([
        "Q2.3.1",
        "Q2.3.3",
      ]);
    },
  );

  it("ne pose pas la série pour un trajet de 50 km ou moins", () => {
    expect(posees({ ...SEUL, "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS" })).toEqual([
      "Q2.3.1",
    ]);
  });
});
