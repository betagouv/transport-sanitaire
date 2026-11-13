import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";

// Une réponse qui change n'efface que les réponses qui en dépendent. Les pages
// sont écrites ici : le questionnaire factice n'a qu'une seule dépendance.

type Questions = {
  source: string;
  cases: readonly ("a" | "b" | "c")[];
  "selon-a-et-b": string;
  dependante: string;
  "dependante-de-dependante": string;
  independante: string;
};

type Id = keyof Questions;

const question = questionsOf<Questions>();

const texte = (id: Id, ...dependsOn: Id[]) =>
  question.text(id, id).dependsOn(...dependsOn);

const SOURCE = page("source", texte("source"));
const PAGES = [
  SOURCE,
  page("dependante", texte("dependante", "source")),
  page(
    "dependante-de-dependante",
    texte("dependante-de-dependante", "dependante"),
  ),
  page("independante", texte("independante")),
];
const QUESTIONNAIRE = new Questionnaire(PAGES);

// Une réponse qui ne dépend que de certaines options d'une autre.
const CASES = page(
  "cases",
  question.multipleChoice("cases", "cases").options({ a: "a", b: "b", c: "c" }),
);
const SELON_A_ET_B = question
  .text("selon-a-et-b", "selon-a-et-b")
  .dependsOn({ question: "cases", options: ["a", "b"] });
const AVEC_CASES = new Questionnaire([CASES, page("selon", SELON_A_ET_B)]);
const cochees = (avant: Questions["cases"], apres: Questions["cases"]) =>
  AVEC_CASES.readWith({ cases: avant, "selon-a-et-b": "x" }).commit(CASES, {
    cases: apres,
  });

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

  it("garde une réponse quand seules d'autres options changent", () => {
    expect(cochees(["a"], ["a", "c"])).toEqual({
      cases: ["a", "c"],
      "selon-a-et-b": "x",
    });
  });

  it("efface une réponse quand l'une de ses options change", () => {
    expect(cochees(["a", "c"], ["b", "c"])).toEqual({ cases: ["b", "c"] });
  });

  it("retire la réponse d'une question que la page ne pose plus", () => {
    const { source: _retiree, ...sansSource } = REPONSES;
    expect(QUESTIONNAIRE.readWith(REPONSES).commit(SOURCE, {})).toEqual({
      independante: sansSource.independante,
    });
  });
});
