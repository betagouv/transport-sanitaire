// Les constructeurs nommés des questions : la sorte et les options viennent du
// constructeur et du catalogue, et les conditions lisent un seul objet. Les
// faits qu'elles y lisent sont ceux des questions validées avant elles.

import { describe, expect, it } from "vitest";
import { questionsOf } from "../../../core/socle";
import type {
  Page,
  Question,
} from "../../../core/socle/questionnaire-engine/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";

type Questions = {
  boisson: "the" | "cafe" | "eau";
  accompagnements: readonly ("lait" | "sucre" | "citron" | "rien")[];
  quantite: number;
};

type Faits = { readonly chaude: boolean };

const OPTIONS = {
  boisson: { the: "Un thé", cafe: "Un café", eau: "De l'eau" },
  accompagnements: {
    lait: "Du lait",
    sucre: "Du sucre",
    citron: "Du citron",
    rien: "Rien",
  },
} as const;

let calculs = 0;

const question = questionsOf<Questions, Faits>({
  options: OPTIONS,
  faits: (_answers, validated) => {
    calculs += 1;
    return { chaude: validated.question("boisson").isOneOf("the", "cafe") };
  },
});

const BOISSON: Page<Questions, undefined> = {
  id: "boisson",
  questions: [question.singleChoice("boisson", { label: "Quelle boisson ?" })],
};

const ACCOMPAGNEMENTS: Page<Questions, undefined> = {
  id: "accompagnements",
  questions: [
    question.multipleChoice("accompagnements", {
      label: "Avec quoi ?",
      labelFrom: ({ answers }) =>
        answers.question("boisson").is("the")
          ? "Avec votre thé ?"
          : "Avec votre café ?",
      askedIf: ({ faits }) => faits.chaude,
      order: ["sucre", "lait"],
      exclusiveOption: "rien",
      options: {
        lait: {
          offeredIf: ({ validated }) => validated.question("boisson").is("the"),
        },
      },
    }),
  ],
};

const QUANTITE: Page<Questions, undefined> = {
  id: "quantite",
  questions: [question.number("quantite", { label: "Combien ?", min: 1 })],
};

const PAGES = [BOISSON, ACCOMPAGNEMENTS, QUANTITE];

const poseesSur = (
  page: Page<Questions, undefined>,
  boisson: Questions["boisson"],
) => new Questionnaire(PAGES).readWith({ boisson }).questionsOn(page);

describe("un constructeur nommé", () => {
  it("donne la sorte et les options du catalogue, dans son ordre", () => {
    const [boisson] = poseesSur(BOISSON, "the");
    expect(boisson).toMatchObject({ id: "boisson", kind: "single choice" });
    expect(boisson?.kind === "single choice" && boisson.options).toEqual([
      { value: "the", label: "Un thé" },
      { value: "cafe", label: "Un café" },
      { value: "eau", label: "De l'eau" },
    ]);
  });

  it("ne garde que les options de `order`, dans cet ordre, et met l'exclusive à part", () => {
    const [accompagnements] = poseesSur(ACCOMPAGNEMENTS, "the");
    if (accompagnements?.kind !== "multiple choice")
      throw new Error("choix multiple attendu");
    expect(accompagnements.options.map((option) => option.value)).toEqual([
      "sucre",
      "lait",
    ]);
    expect(accompagnements.exclusiveOption).toEqual({
      value: "rien",
      label: "Rien",
    });
  });

  it("passe le contexte aux libellés et aux options du moment", () => {
    const [accompagnements] = poseesSur(ACCOMPAGNEMENTS, "cafe");
    if (accompagnements?.kind !== "multiple choice")
      throw new Error("choix multiple attendu");
    expect(accompagnements.label).toBe("Avec votre café ?");
    expect(accompagnements.options.map((option) => option.value)).toEqual([
      "sucre",
    ]);
  });

  it("donne aussi la sorte d'une saisie, avec ce qu'elle déclare", () => {
    const [quantite] = poseesSur(QUANTITE, "eau");
    expect(quantite).toMatchObject({ id: "quantite", kind: "number", min: 1 });
  });
  it("refuse, au typage, un id d'une autre sorte ou une option inconnue", () => {
    // @ts-expect-error « quantite » n'est pas une question à choix.
    question.singleChoice("quantite", { label: "Combien ?" });
    // @ts-expect-error « citron » n'est pas une boisson.
    question.singleChoice("boisson", { label: "Quoi ?", order: ["citron"] });
    // @ts-expect-error « boisson » n'est pas un nombre.
    question.number("boisson", { label: "Combien ?" });
  });
});

describe("une garde qui lit les faits", () => {
  it("les lit sur les questions validées avant elle", () => {
    expect(poseesSur(ACCOMPAGNEMENTS, "the")).toHaveLength(1);
    expect(poseesSur(ACCOMPAGNEMENTS, "eau")).toHaveLength(0);
  });

  it("ne les fait calculer que si elle les lit", () => {
    calculs = 0;
    new Questionnaire([BOISSON])
      .readWith({ boisson: "the" })
      .questionsOn(BOISSON);
    expect(calculs).toBe(0);
  });

  it("arrête net un fait qui la lit à son tour", () => {
    const boucle = questionsOf<Questions, Faits>({
      options: OPTIONS,
      faits: (): Faits => ({
        chaude:
          new Questionnaire([page]).readWith({}).questionsOn(page).length > 0,
      }),
    });
    const garde: Question<Questions, undefined> = boucle.number("quantite", {
      label: "Combien ?",
      askedIf: ({ faits }) => faits.chaude,
    });
    const page = { id: "quantite", questions: [garde] };
    expect(() =>
      new Questionnaire([page]).readWith({}).questionsOn(page),
    ).toThrow("un fait ne lit jamais une garde qui lit les faits");
  });
});
