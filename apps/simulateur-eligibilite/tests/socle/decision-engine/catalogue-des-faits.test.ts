// Le catalogue des faits : une déclaration par fait. Il refuse un doublon, un
// oubli et un fait hors du modèle, calcule chaque fait à sa première lecture,
// et arrête net un fait qui se lit lui-même.

import { describe, expect, it } from "vitest";
import {
  Fait,
  FaitCatalogue,
  type FaitDeclarations,
  page,
  Questionnaire,
  questionsOf,
  unFait,
} from "../../../core/socle";
import { GivenAnswers } from "../../../core/socle/questionnaire-engine/given-answers";
import { ValidatedAnswers } from "../../../core/socle/questionnaire-engine/validated-answers";

type Questions = { boisson: "the" | "cafe" | "eau"; quantite: number };
type Faits = { readonly chaude: Fait; readonly servie: Fait };
type Declarations = FaitDeclarations<Questions, Faits>;

const NOMS = ["chaude", "servie"] as const;

let calculs: string[] = [];

const CHAUDE: Declarations = {
  chaude: ({ validated }) => {
    calculs.push("chaude");
    return unFait()
      .selon(validated.question("boisson"), {
        the: "oui",
        cafe: "oui",
        eau: "non",
      })
      .sinon("Pas encore de boisson.");
  },
};
const SERVIE: Declarations = {
  servie: ({ faits }) => {
    calculs.push("servie");
    return unFait()
      .ouiSi(faits.chaude.isOui(), "Une boisson chaude se sert.")
      .sinon("Rien à servir.");
  },
};

const lus = (
  catalogue: FaitCatalogue<Questions, Faits>,
  boisson?: Questions["boisson"],
) => {
  const reponses = boisson ? { boisson } : {};
  return catalogue.read(
    new GivenAnswers<Questions>(reponses),
    new ValidatedAnswers<Questions>(
      boisson ? { boisson: { offered: [], answer: boisson } } : {},
    ),
  );
};

describe("le catalogue des faits", () => {
  const catalogue = new FaitCatalogue<Questions, Faits>(NOMS, CHAUDE, SERVIE);

  it("donne chaque fait par sa déclaration, qui peut lire un autre fait", () => {
    const faits = lus(catalogue, "the");
    expect(faits.chaude).toEqual(Fait.oui("boisson : « the »."));
    expect(faits.servie).toEqual(Fait.oui("Une boisson chaude se sert."));
    expect(Object.keys(faits)).toEqual(["chaude", "servie"]);
  });

  it("calcule un fait à sa première lecture, une seule fois", () => {
    calculs = [];
    const faits = lus(catalogue, "eau");
    expect(calculs).toEqual([]);
    expect(faits.chaude.isNon()).toBe(true);
    expect(faits.chaude.isNon()).toBe(true);
    expect(calculs).toEqual(["chaude"]);
  });

  it("garde un fait imposé, sans le calculer", () => {
    calculs = [];
    const faits = catalogue.read(
      new GivenAnswers<Questions>({}),
      new ValidatedAnswers<Questions>({}),
      { chaude: Fait.oui("Imposé.") },
    );
    expect(faits.servie.isOui()).toBe(true);
    expect(calculs).toEqual(["servie"]);
  });

  it("refuse un fait déclaré deux fois", () => {
    expect(
      () => new FaitCatalogue<Questions, Faits>(NOMS, CHAUDE, CHAUDE, SERVIE),
    ).toThrow("« chaude » se déclare deux fois.");
  });

  it("refuse un fait oublié", () => {
    expect(() => new FaitCatalogue<Questions, Faits>(NOMS, CHAUDE)).toThrow(
      "Ces faits ne sont pas déclarés : servie.",
    );
  });

  it("refuse un fait qui n'est pas du modèle", () => {
    const hors = { froide: () => Fait.non("…") } as Declarations;
    expect(
      () => new FaitCatalogue<Questions, Faits>(NOMS, CHAUDE, SERVIE, hors),
    ).toThrow("« froide » n'est pas un fait du modèle.");
  });
});

describe("un fait qui se lit lui-même", () => {
  it("s'arrête net, par d'autres faits", () => {
    const boucle = new FaitCatalogue<Questions, Faits>(NOMS, {
      chaude: ({ faits }) =>
        unFait().ouiSi(faits.servie.isOui(), "…").sinon("…"),
      servie: ({ faits }) =>
        unFait().ouiSi(faits.chaude.isOui(), "…").sinon("…"),
    });
    expect(() => lus(boucle).chaude).toThrow(
      "« chaude » se lit lui-même : chaude → servie → chaude.",
    );
  });

  it("s'arrête net, par une garde qui le lit", () => {
    const question = questionsOf<Questions, Faits>({
      options: { boisson: { the: "Thé", cafe: "Café", eau: "Eau" } },
      faits: (answers, validated) => boucle.read(answers, validated),
    });
    const quantite = page(
      "quantite",
      question
        .number("quantite", "Combien ?")
        .askedIf(({ faits }) => faits.chaude.isOui()),
    );
    const boucle: FaitCatalogue<Questions, Faits> = new FaitCatalogue(
      NOMS,
      SERVIE,
      {
        chaude: ({ answers }) =>
          unFait()
            .ouiSi(
              new Questionnaire([quantite]).readWith(answers).isComplete(),
              "…",
            )
            .sinon("…"),
      },
    );
    expect(() => lus(boucle).chaude).toThrow("« chaude » se lit lui-même");
  });
});
