// Les places d'une question sous des réponses de sa page (`shownUnder`) : la
// question posée dit celles qui valent, dans l'ordre déclaré. Une place
// restreinte par `while` ne vaut que tant que sa condition tient, et cette
// condition ne lit que des questions d'avant. Les pages sont écrites ici.

import { describe, expect, it } from "vitest";
import { page, QuestionFactory, ReadingFactory } from "../../../core/socle";
import type { Page } from "../../../core/socle/questionnaire-engine";
import type { Answers } from "../../../core/socle/questionnaire-engine/question/question.types";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire.vo";

type Questions = {
  distance: "courte" | "longue";
  ligne: boolean;
  urgence: "oui" | "non";
  ensuite: "oui" | "non";
};

const question = new QuestionFactory<Questions>();
const given = new ReadingFactory<Questions>();

const DISTANCE = question
  .singleChoice("distance", "Quelle distance ?")
  .possibleAnswers({ courte: "Courte", longue: "Longue" });
const LIGNE = question.checkbox("ligne", "En avion.");
const URGENCE = question
  .singleChoice("urgence", "Urgent ?")
  .possibleAnswers({ oui: "Oui", non: "Non" });
const ENSUITE = question
  .singleChoice("ensuite", "Ensuite ?")
  .possibleAnswers({ oui: "Oui", non: "Non" });

describe("les places d'une question sous des réponses", () => {
  it("se disent dans l'ordre déclaré, case seule comprise", () => {
    const urgence = URGENCE.shownUnder("distance", "longue").shownUnder(
      "ligne",
    );

    expect(placesDe([page("trajet", DISTANCE, LIGNE, urgence)], {})).toEqual([
      { question: "distance", possibleAnswer: "longue" },
      { question: "ligne" },
    ]);
  });

  it("ne valent, restreintes, que tant que leur condition tient", () => {
    const urgence = URGENCE.shownUnder("ligne", {
      while: given.question("distance").answer().is("longue"),
    });
    const pages = [page("trajet", DISTANCE, LIGNE, urgence)];

    expect(placesDe(pages, { distance: "courte" })).toEqual([]);
    expect(placesDe(pages, { distance: "longue" })).toEqual([
      { question: "ligne" },
    ]);
  });

  it("peuvent nommer une question d'une autre page", () => {
    const urgence = URGENCE.shownUnder("distance", "longue");

    expect(() =>
      new Questionnaire([
        page("distance", DISTANCE),
        page("urgence", urgence),
      ]).readWith({}),
    ).not.toThrow();
  });

  it("ne lisent pas une question d'après", () => {
    const urgence = URGENCE.shownUnder("distance", "longue", {
      while: given.question("ensuite").answer().is("oui"),
    });
    const pages = [page("trajet", DISTANCE, urgence), page("suite", ENSUITE)];

    expect(() => placesDe(pages, { distance: "longue" })).toThrow(
      "Une garde de urgence lit ensuite, qui ne se pose pas avant elle.",
    );
  });
});

// ---- implémentation ----

// Les places de l'urgence, posée sur la première page.
function placesDe(pages: readonly Page[], reponses: Answers<Questions>) {
  const lue = new Questionnaire(pages).readWith(reponses);
  const premiere = pages[0] as Page;
  return lue.questionsOn(premiere).find(({ id }) => id === "urgence")?.under;
}
