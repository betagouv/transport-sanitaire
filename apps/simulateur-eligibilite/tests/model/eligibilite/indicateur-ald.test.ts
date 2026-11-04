// L'indicateur de parcours ALD (#148) sur le modèle réel : le verdict d'un
// parcours, les pages et les questions posées de P1 à R2.
//
// Le parcours de référence est celui de `SPECIFICATION_ALD_6_QUESTIONS.md` pour
// un nouveau patient : Q2.2.1, répondue « Aucune », ajoute une page et une
// question au témoin fermé, qui en compte quatre et cinq. La spécification
// attend donc cinq pages et six questions de P1 à P2. Le second bloc, Q2.2.1.b,
// en ajoute une de chaque : ses soins changent encore l'issue, et la
// spécification ne masque pas une question décisive pour tenir la cible
// (D-252).

import { describe, expect, it } from "vitest";
import type { Answers } from "../../../core/socle/questionnaire-engine";
import { Simulation } from "../../../core/socle/simulation";
import { model } from "../../../front/models/eligibilite";
import { aldPathwayOf } from "../../../front/socle/simulateur/track-the-ald-pathway";

const ALD = {
  "Q0.1": "2_VERIFIER_ET_PRESCRIRE",
  "Q1.1": "3_AVEC_UN_PROFESSIONNEL",
  "Q1.2": ["7_ALLONGE"],
  "Q1.3": ["2_ALD"],
  "Q1.3.b": "1_LIEN_DIRECT",
};

const verdictDe = (answers: Answers) =>
  aldPathwayOf(model, Simulation.resume(model.core, answers));

describe("l'indicateur de parcours ALD", () => {
  it("compte le second bloc des situations : six pages, sept questions", () => {
    expect(
      verdictDe({
        ...ALD,
        "Q2.2.1": ["0_AUCUNE"],
        "Q2.2.1.b": ["0_AUCUN"],
        "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
        "Q2.3.2": false,
      }),
    ).toEqual({
      verdict: "parcours_ald_trop_de_questions",
      pages: 6,
      questions: 7,
    });
  });

  it("compte une question de trop au-delà de cinquante kilomètres", () => {
    expect(
      verdictDe({
        ...ALD,
        "Q2.2.1": ["2_ETRANGER"],
        "Q2.2.5": ["1_DEPART"],
        "Q2.2.1.b": ["0_AUCUN"],
        "Q2.3.1": "2_PLUS_DE_CINQUANTE_KM",
        "Q2.3.2": false,
      }),
    ).toEqual({
      verdict: "parcours_ald_trop_de_questions",
      pages: 6,
      questions: 8,
    });
  });

  it("compte trop de pages quand le transport part d'une hospitalisation", () => {
    expect(
      verdictDe({
        ...ALD,
        "Q2.2.1": ["1_HOSPITALISATION"],
        "Q2.2.1.cadre": "1_ETABLISSEMENT",
        "Q2.2.1.a": "2_NON",
        "Q2.3.1": "2_PLUS_DE_CINQUANTE_KM",
        "Q2.3.2": false,
        "Q2.5": "2_AUTRE_DEPLACEMENT",
        "Q2.6": ["7_EHPAD"],
      }),
    ).toEqual({
      verdict: "parcours_ald_trop_de_pages",
      pages: 7,
      questions: 10,
    });
  });

  it("met à part un parcours qui finit à la caisse", () => {
    expect(
      verdictDe({
        ...ALD,
        "Q2.2.1": ["5_HTNM"],
        "Q2.2.1.b": ["0_AUCUN"],
      }),
    ).toEqual({ verdict: "parcours_ald_caisse", pages: 5, questions: 5 });
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
