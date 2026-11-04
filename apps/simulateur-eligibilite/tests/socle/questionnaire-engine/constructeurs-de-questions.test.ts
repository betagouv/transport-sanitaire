// Les constructeurs des questions : la sorte et les options viennent du
// constructeur et du catalogue, puis chaque réglage s'écrit sur sa ligne. Les
// conditions lisent un seul objet, et les faits qu'elles y lisent sont ceux des
// questions validées avant elles.

import { describe, expect, it } from "vitest";
import {
  Fait,
  FaitCatalogue,
  givenOf,
  page,
  questionsOf,
  unFait,
} from "../../../core/socle";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";

type Questions = {
  boisson: "the" | "cafe" | "eau";
  accompagnements: readonly ("lait" | "sucre" | "citron" | "rien")[];
  quantite: number;
  remarque: string;
};

type Faits = { readonly chaude: Fait };

let calculs = 0;

const given = givenOf<Questions, Faits, undefined>();
const boisson = given.question("boisson").answer();

const question = questionsOf<Questions, Faits>({
  faits: new FaitCatalogue<Faits>(
    ["chaude"],
    [
      unFait("chaude").vaut(
        boisson.isOneOf("the", "cafe").compute((chaude) => {
          calculs += 1;
          return chaude
            ? Fait.oui("Boisson chaude.")
            : Fait.non("Boisson froide.");
        }),
      ),
    ],
  ),
});

const BOISSON = page(
  "boisson",
  question
    .singleChoice("boisson", "Quelle boisson ?")
    .options({ the: "Un thé", cafe: "Un café", eau: "De l'eau" }),
);

const ACCOMPAGNEMENTS = page(
  "accompagnements",
  question
    .multipleChoice("accompagnements", "Avec quoi ?")
    .options({
      lait: "Du lait",
      sucre: "Du sucre",
      citron: "Du citron",
      rien: "Rien",
    })
    .labelFrom(({ answers }) =>
      answers.question("boisson").is("the")
        ? "Avec votre thé ?"
        : "Avec votre café ?",
    )
    .mattersWhile(given.fait("chaude").isOui())
    .order("sucre", "lait")
    .exclusive("rien")
    .option("lait", (option) => option.offeredWhen(boisson.is("the"))),
);

const QUANTITE = page(
  "quantite",
  question.number("quantite", "Combien ?").min(1),
);

const PAGES = [BOISSON, ACCOMPAGNEMENTS, QUANTITE];

const poseesSur = (
  surLaPage: (typeof PAGES)[number],
  boisson: Questions["boisson"],
) => new Questionnaire(PAGES).readWith({ boisson }).questionsOn(surLaPage);

describe("un constructeur", () => {
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

  it("donne aussi la sorte d'une saisie, avec ses réglages", () => {
    const [quantite] = poseesSur(QUANTITE, "eau");
    expect(quantite).toMatchObject({ id: "quantite", kind: "number", min: 1 });
  });

  it("donne une copie à chaque réglage, sans toucher à la question d'avant", () => {
    const libre = question.number("quantite", "Combien ?");
    const bornee = libre.min(2);
    const lire = (declaree: typeof libre) => {
      const seule = page("quantite", declaree);
      return new Questionnaire([seule]).readWith({}).questionsOn(seule)[0];
    };
    expect(lire(libre)).toMatchObject({ min: undefined });
    expect(lire(bornee)).toMatchObject({ min: 2 });
  });

  it("refuse, au typage, une option inconnue ou un réglage d'une autre sorte", () => {
    const boisson = question
      .singleChoice("boisson", "Quoi ?")
      .options({ the: "Un thé", cafe: "Un café" });
    // @ts-expect-error « citron » n'est pas une boisson.
    boisson.order("citron");
    // @ts-expect-error « citron » n'est pas une boisson.
    boisson.option("citron", (o) => o);
    expect(() =>
      // @ts-expect-error un texte n'a pas de borne.
      question.text("remarque", "Une remarque ?").min(1),
    ).toThrow(TypeError);
  });
});

describe("une condition de page", () => {
  it("s'ajoute à celles de chacune de ses questions", () => {
    const sansEau = page(
      "quantite",
      question.number("quantite", "Combien ?"),
      question
        .text("remarque", "Une remarque ?")
        .appliesWhen(boisson.is("the")),
    ).appliesWhen(boisson.is("eau").not());
    const posees = (boisson: Questions["boisson"]) =>
      new Questionnaire([BOISSON, sansEau])
        .readWith({ boisson })
        .questionsOn(sansEau)
        .map(({ id }) => id);

    expect(posees("the")).toEqual(["quantite", "remarque"]);
    expect(posees("cafe")).toEqual(["quantite"]);
    expect(posees("eau")).toEqual([]);
  });
});

describe("une incohérence", () => {
  const combien = given.question("quantite").answer();

  it("peut citer les réponses dans son message", () => {
    const trop = page(
      "quantite",
      question.number("quantite", "Combien ?").inconsistentWhen(
        combien.compute(({ value }) => (value ?? 0) > 3),
        combien.compute(({ value }) => `${value} tasses, c'est trop.`),
      ),
    );
    const [quantite] = new Questionnaire([trop])
      .readWith({ quantite: 5 })
      .questionsOn(trop);
    expect(quantite?.inconsistencies).toEqual(["5 tasses, c'est trop."]);
  });
});

describe("les options du catalogue", () => {
  it("refusent une valeur qui a l'air d'un entier : elle passerait avant les autres", () => {
    const entiers = questionsOf<{ choix: "a" | "1" }>();
    expect(() =>
      entiers.singleChoice("choix", "Lequel ?").options({ a: "A", "1": "Un" }),
    ).toThrow("« 1 » a l'air d'un entier");
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
});
