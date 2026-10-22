import { describe, expect, it } from "vitest";
import type {
  Page,
  Question,
} from "../../../core/socle/questionnaire-engine/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";

// Une réponse qui change n'efface que les réponses qui en dépendent. Les pages
// sont écrites ici : le questionnaire factice n'a qu'une seule dépendance.

const texte = (id: string, dependsOn?: string[]): Question => ({
  id,
  kind: "text",
  label: id,
  dependsOn,
});

const page = (question: Question): Page => ({
  id: question.id,
  questions: [question],
});

const SOURCE = page(texte("source"));
const PAGES = [
  SOURCE,
  page(texte("dependante", ["source"])),
  page(texte("dependante-de-dependante", ["dependante"])),
  page(texte("independante")),
];
const QUESTIONNAIRE = new Questionnaire(PAGES);

const REPONSES = {
  source: "a",
  dependante: "b",
  "dependante-de-dependante": "c",
  independante: "d",
};

describe("validation d'une page", () => {
  it("efface les réponses dépendantes, de proche en proche", () => {
    expect(
      QUESTIONNAIRE.readWith(REPONSES).commit(SOURCE, { source: "z" }),
    ).toEqual({
      source: "z",
      independante: "d",
    });
  });

  it("ne touche à rien quand la réponse est la même", () => {
    expect(
      QUESTIONNAIRE.readWith(REPONSES).commit(SOURCE, { source: "a" }),
    ).toEqual(REPONSES);
  });

  it("tient une adresse pour la même, quel que soit l'ordre de ses champs", () => {
    const saisie = {
      street: "3 rue des Lilas",
      postalCode: "75012",
      city: "Paris",
    };
    const reprise = {
      city: "Paris",
      postalCode: "75012",
      street: "3 rue des Lilas",
    };

    expect(
      QUESTIONNAIRE.readWith({ ...REPONSES, source: reprise }).commit(SOURCE, {
        source: saisie,
      }),
    ).toEqual({ ...REPONSES, source: saisie });
  });

  it("efface les réponses dépendantes d'une adresse dont un champ change", () => {
    const adresse = {
      street: "3 rue des Lilas",
      postalCode: "75012",
      city: "Paris",
    };

    expect(
      QUESTIONNAIRE.readWith({ ...REPONSES, source: adresse }).commit(SOURCE, {
        source: { ...adresse, city: "Lyon" },
      }),
    ).toEqual({ source: { ...adresse, city: "Lyon" }, independante: "d" });
  });

  it("retire la réponse d'une question que la page ne pose plus", () => {
    const { source: _retiree, ...sansSource } = REPONSES;
    expect(QUESTIONNAIRE.readWith(REPONSES).commit(SOURCE, {})).toEqual({
      independante: sansSource.independante,
    });
  });
});
