// Ce que le modèle lit des réponses : la réponse d'une question, ses cases
// cochées, et, une fois validée, ce qui s'y proposait. Une question sans
// réponse n'est aucune option, sans être un « non ». Une case jamais montrée
// ne dit rien.

import { describe, expect, it } from "vitest";
import { GivenAnswers } from "../../../core/socle/questionnaire-engine/given-answers";
import { ValidatedAnswers } from "../../../core/socle/questionnaire-engine/validated-answers";

type Questions = {
  boisson: "the" | "cafe";
  accompagnements: ("lait" | "sucre" | "citron")[];
  quantite: number;
};

const donnees = new GivenAnswers<Questions>({
  boisson: "the",
  accompagnements: ["lait"],
});

const validees = new ValidatedAnswers<Questions>({
  boisson: { offered: ["the", "cafe"], answer: "the" },
  accompagnements: { offered: ["lait", "sucre"], answer: ["lait"] },
});

describe("une réponse donnée", () => {
  it("est l'option choisie, et aucune autre", () => {
    const boisson = donnees.question("boisson");
    expect(boisson.is("the")).toBe(true);
    expect(boisson.is("cafe")).toBe(false);
    expect(boisson.isOneOf("cafe", "the")).toBe(true);
    expect(boisson.isNot("cafe")).toBe(true);
    expect(boisson.isNot("the")).toBe(false);
  });

  it("dit ses cases cochées", () => {
    const accompagnements = donnees.question("accompagnements");
    expect(accompagnements.checked("lait")).toBe(true);
    expect(accompagnements.checked("sucre")).toBe(false);
    expect(accompagnements.hasAnyChecked()).toBe(true);
    expect(accompagnements.checkedBoxes()).toEqual(["lait"]);
  });

  it("absente, n'est aucune option et n'a rien de coché", () => {
    const quantite = donnees.question("quantite");
    expect(quantite.hasAnswer()).toBe(false);
    expect(quantite.value).toBeUndefined();
    expect(
      new GivenAnswers<Questions>({}).question("boisson").isNot("the"),
    ).toBe(true);
    expect(new GivenAnswers<Questions>({}).question("boisson").is("the")).toBe(
      false,
    );
    expect(
      new GivenAnswers<Questions>({})
        .question("accompagnements")
        .checkedBoxes(),
    ).toEqual([]);
  });
});

describe("une question validée", () => {
  it("dit ce qui s'y proposait", () => {
    const accompagnements = validees.question("accompagnements");
    expect(accompagnements.isValidated()).toBe(true);
    expect(accompagnements.offers("sucre")).toBe(true);
    expect(accompagnements.offers("citron")).toBe(false);
    expect(accompagnements.offeredOptions()).toEqual(["lait", "sucre"]);
  });

  it("a écarté une case proposée et non cochée, pas une case jamais montrée", () => {
    const accompagnements = validees.question("accompagnements");
    expect(accompagnements.declined("sucre")).toBe(true);
    expect(accompagnements.declined("lait")).toBe(false);
    expect(accompagnements.declined("citron")).toBe(false);
  });

  it("non validée, n'a ni réponse ni option", () => {
    const quantite = validees.question("quantite");
    expect(quantite.isValidated()).toBe(false);
    expect(quantite.hasAnswer()).toBe(false);
    expect(quantite.offeredOptions()).toEqual([]);
  });
});
