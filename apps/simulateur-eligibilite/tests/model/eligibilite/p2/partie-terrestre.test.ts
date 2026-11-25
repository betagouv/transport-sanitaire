// La partie terrestre d'un trajet en avion ou en bateau de ligne régulière,
// Q2.3.2.terrestre (v10.2.1, R02 et R03) : sous la case cochée, et seulement
// alors ; effacée quand on décoche la case ; lue par R2, jamais en « non »
// par défaut.

import { describe, expect, it } from "vitest";
import { model } from "../../../../core/models/eligibilite";
import { R2 } from "../../../../core/models/eligibilite/r2/r2";
import { Questionnaire } from "../../../../core/socle/questionnaire-engine";
import { lectureDe, type Reponses } from "./reponses-de-la-permission";

const pages = Questionnaire.pagesOf(model.questionnaire);
const TRAJET = (() => {
  const page = pages.find(({ id }) => id === "P2/trajet");
  if (!page) throw new Error("Page inconnue : P2/trajet");
  return page;
})();

// Un patient seul, pour une consultation à 50 km ou moins, dont une partie du
// trajet se fait en avion ou en bateau de ligne régulière.
const LIGNE: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "1_SEUL",
  "Q1.3": ["7_AUCUNE"],
  "Q1.4": "1_VEHICULE_PERSONNEL",
  "Q2.1": "1_CONSULTATION",
  "Q2.2.1": ["0_AUCUNE"],
  "Q2.2.1.b": ["0_AUCUN"],
  "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
  "Q2.3.2": true,
};

const MIXTE: Reponses = { ...LIGNE, "Q2.3.2.terrestre": "1_OUI" };

describe("la question de la partie terrestre", () => {
  it("se pose juste sous la case cochée", () => {
    expect(posees(LIGNE).slice(0, 3)).toEqual([
      "Q2.3.1",
      "Q2.3.2",
      "Q2.3.2.terrestre",
    ]);
  });

  it("ne se pose pas sans la ligne régulière", () => {
    expect(posees({ ...LIGNE, "Q2.3.2": false })).not.toContain(
      "Q2.3.2.terrestre",
    );
  });

  it("demande Oui ou Non, sans réponse par défaut, avec l'aide de l'éditeur", () => {
    expect(questionPosee(LIGNE)).toMatchObject({
      kind: "single choice",
      label:
        "Pour ce déplacement, un transport terrestre est-il également prévu avant ou après l’avion ou le bateau ?",
      hint: "Par exemple, en voiture, transports en commun, taxi/VSL, TPMR ou ambulance, pour rejoindre ou quitter l’aéroport ou le port.",
      optional: false,
      possibleAnswers: [
        expect.objectContaining({ value: "1_OUI", label: "Oui" }),
        expect.objectContaining({ value: "2_NON", label: "Non" }),
      ],
    });
  });
});

describe("la réponse de la partie terrestre", () => {
  it("reste sur sa page, modifiable, sans se redemander ailleurs", () => {
    const revalidee = valideeAvec(MIXTE, {});

    expect(revalidee).toHaveProperty("Q2.3.2.terrestre", "1_OUI");
    expect(
      posees(revalidee).filter((id) => id === "Q2.3.2.terrestre"),
    ).toHaveLength(1);
  });

  it("s'efface quand on décoche la case", () => {
    const decochee = valideeAvec(MIXTE, { "Q2.3.2": false });

    expect(decochee).not.toHaveProperty("Q2.3.2.terrestre");
  });

  it("revient vide quand on recoche la case", () => {
    const recochee = {
      ...valideeAvec(MIXTE, { "Q2.3.2": false }),
      "Q2.3.2": true,
    };

    expect(posees(recochee)).toContain("Q2.3.2.terrestre");
    expect(recochee).not.toHaveProperty("Q2.3.2.terrestre");
  });
});

describe("ce que R2 lit de la partie terrestre", () => {
  it.each([
    ["1_OUI", true],
    ["2_NON", false],
  ] as const)("%s : %s", (reponse, partie) => {
    expect(
      traceDe({ ...LIGNE, "Q2.3.2.terrestre": reponse }).partieTerrestre,
    ).toBe(partie);
  });

  it("rien sans réponse : jamais un « non » (R03)", () => {
    expect("partieTerrestre" in traceDe(LIGNE)).toBe(false);
  });
});

// ---- implémentation ----

function posees(reponses: Reponses): string[] {
  return new Questionnaire(pages)
    .readWith(reponses)
    .questionsOn(TRAJET)
    .map(({ id }) => id);
}

function questionPosee(reponses: Reponses) {
  return new Questionnaire(pages)
    .readWith(reponses)
    .questionsOn(TRAJET)
    .find(({ id }) => id === "Q2.3.2.terrestre");
}

// Les réponses une fois la page du trajet rouverte, changée, puis validée.
function valideeAvec(reponses: Reponses, changees: Reponses): Reponses {
  const brouillon = Object.fromEntries(
    TRAJET.questions.flatMap(({ id }) => {
      const reponse = reponses[id as keyof Reponses];
      return reponse === undefined ? [] : [[id, reponse]];
    }),
  );
  return new Questionnaire(pages)
    .readWith(reponses)
    .commit(TRAJET, { ...brouillon, ...changees }) as Reponses;
}

function traceDe(reponses: Reponses) {
  return R2.of(lectureDe(reponses)).trace;
}
