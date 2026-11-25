// Quelles pages avancent d'elles-mêmes : un seul choix unique, affiché seul.

import { describe, expect, it } from "vitest";
import { page, QuestionFactory } from "../../../core/socle";
import {
  type Page,
  Questionnaire,
} from "../../../core/socle/questionnaire-engine";
import { AdvanceAloneService } from "../../../front/socle/questionnaire/advance-alone.service";

type Questions = {
  avis: "bien" | "mal";
  lieu: "domicile" | "etablissement";
  nom: string;
  accord: boolean;
};

const question = new QuestionFactory<Questions>();
const REPONSES = { bien: "Bien", mal: "Mal" };

const AVIS = question
  .singleChoice("avis", "Un avis ?")
  .possibleAnswers(REPONSES);
const LIEU = question
  .singleChoice("lieu", "Quel lieu ?")
  .possibleAnswers({ domicile: "Domicile", etablissement: "Établissement" });
const NOM = question.text("nom", "Quel nom ?");
const ACCORD = question.checkbox("accord", "D'accord.");

describe("l'avancement automatique d'une page", () => {
  it("vaut pour un seul choix unique affiché seul", () => {
    expect(avanceSeule(page("p", AVIS))).toBe(true);
  });

  it("ne vaut pas pour une page composée", () => {
    expect(avanceSeule(page("p", AVIS, LIEU))).toBe(false);
  });

  it("ne vaut pas pour une saisie ni pour une case", () => {
    expect(avanceSeule(page("p", NOM))).toBe(false);
    expect(avanceSeule(page("p", ACCORD))).toBe(false);
  });

  it("ne vaut pas pour une question facultative", () => {
    expect(avanceSeule(page("p", AVIS.optional()))).toBe(false);
  });

  it("ne vaut pas pour une liste déroulante", () => {
    expect(avanceSeule(page("p", LIEU.dropdown()))).toBe(false);
  });

  it("ne vaut pas pour une page sans question", () => {
    expect(new AdvanceAloneService([]).isSingleChoicePage()).toBe(false);
  });
});

// Ce que la règle dit de la page, lue sans réponse.
function avanceSeule(ouverte: Page) {
  const questions = new Questionnaire([ouverte])
    .readWith({})
    .questionsOn(ouverte);
  return new AdvanceAloneService(questions).isSingleChoicePage();
}
