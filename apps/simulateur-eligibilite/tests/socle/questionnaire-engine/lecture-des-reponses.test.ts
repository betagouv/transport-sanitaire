// Ce que le modèle lit des réponses : la réponse d'une question, ses cases
// cochées, et, une fois validée, ce qui s'y proposait. Une question sans
// réponse n'est aucune option, sans être un « non ». Une case jamais montrée
// ne dit rien.

import { describe, expect, it } from "vitest";
import { Fait } from "../../../core/socle/decision-engine/fait";
import { GivenAnswers } from "../../../front/socle/questionnaire-engine/given-answers";
import { ValidatedAnswers } from "../../../front/socle/questionnaire-engine/validated-answers";

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

describe("le fait d'une case", () => {
  const accompagnements = validees.question("accompagnements");

  it("vaut « oui » quand elle est cochée", () => {
    expect(accompagnements.faitOf("lait")).toEqual(
      Fait.oui("accompagnements : « lait » cochée."),
    );
  });

  it("vaut « non » quand elle se proposait sans être cochée", () => {
    expect(accompagnements.faitOf("sucre")).toEqual(
      Fait.non("accompagnements : « sucre » proposée, non cochée."),
    );
  });

  it("ne dit rien quand elle ne se proposait pas", () => {
    expect(accompagnements.faitOf("citron")).toBeUndefined();
  });
});

describe("un fait", () => {
  it("garde sa valeur et sa provenance", () => {
    expect(Fait.oui("coché")).toEqual({ value: true, provenance: "coché" });
    expect(Fait.non("écarté")).toEqual({ value: false, provenance: "écarté" });
  });

  it("inconnu, n'a pas de valeur : ce n'est pas un « non »", () => {
    expect(Fait.inconnu("pas encore validé")).toEqual({
      provenance: "pas encore validé",
    });
  });
});
