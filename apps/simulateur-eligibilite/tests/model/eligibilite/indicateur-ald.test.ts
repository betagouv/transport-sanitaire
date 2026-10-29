// L'indicateur de parcours ALD (#148) sur le modèle réel : le verdict d'un
// parcours, les pages et les questions posées de P1 à R2.
//
// Le parcours de référence est celui de `SPECIFICATION_ALD_6_QUESTIONS.md` pour
// un nouveau patient : Q2.2.1, répondue « Aucune », ajoute une page et une
// question au témoin fermé, qui en compte quatre et cinq. La spécification
// attend donc cinq pages et six questions de P1 à P2.

import { describe, expect, it } from "vitest";
import type { Answers } from "../../../core/socle/questionnaire-engine/question";
import { model } from "../../../front/models/eligibilite";
import { aldPathwayOf } from "../../../front/socle/simulateur/ald-indicator";

const ALD = {
  "Q0.1": "2_VERIFIER_ET_PRESCRIRE",
  "Q1.1": "3_AVEC_UN_PROFESSIONNEL",
  "Q1.2": ["7_ALLONGE"],
  "Q1.3": ["2_ALD"],
  "Q1.3.b": "1_LIEN_DIRECT",
};

const verdictDe = (answers: Answers) => aldPathwayOf(model, answers);

describe("l'indicateur de parcours ALD", () => {
  it("met le parcours de référence dans la cible : cinq pages, six questions", () => {
    expect(
      verdictDe({
        ...ALD,
        "Q2.2.1": ["4_AUCUNE"],
        "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
        "Q2.3.2": false,
      }),
    ).toEqual({
      verdict: "parcours_ald_dans_la_cible",
      pages: 5,
      questions: 6,
    });
  });

  it("compte une question de trop au-delà de cinquante kilomètres", () => {
    expect(
      verdictDe({
        ...ALD,
        "Q2.2.1": ["2_ETRANGER"],
        "Q2.2.5": ["1_DEPART"],
        "Q2.3.1": "2_PLUS_DE_CINQUANTE_KM",
        "Q2.3.2": false,
      }),
    ).toEqual({
      verdict: "parcours_ald_trop_de_questions",
      pages: 5,
      questions: 7,
    });
  });

  it("compte trop de pages quand le transport part d'une hospitalisation", () => {
    expect(
      verdictDe({
        ...ALD,
        "Q2.2.1": ["1_HOSPITALISATION"],
        "Q2.2.1.a": "2_NON",
        "Q2.3.1": "2_PLUS_DE_CINQUANTE_KM",
        "Q2.3.2": false,
        "Q2.5": "2_AUTRE_DEPLACEMENT",
        "Q2.6": ["7_EHPAD"],
      }),
    ).toEqual({
      verdict: "parcours_ald_trop_de_pages",
      pages: 7,
      questions: 9,
    });
  });

  it("met à part un parcours qui finit à la caisse", () => {
    expect(
      verdictDe({
        ...ALD,
        "Q2.2.1": ["3_AUTRE_CADRE"],
        "Q2.2.1.b": ["5_HTNM"],
      }),
    ).toEqual({ verdict: "parcours_ald_caisse", pages: 4, questions: 5 });
  });

  it("ne compte pas le mineur en soins continus", () => {
    expect(
      verdictDe({
        ...ALD,
        "Q1.3": ["8_MINEUR_SOINS_CONTINUS"],
        "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
        "Q2.3.2": false,
      }),
    ).toBeNull();
  });
});
