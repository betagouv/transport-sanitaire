import { describe, expect, it } from "vitest";
import {
  afterLock,
  Cible,
  givenOf,
  page,
  questionsOf,
} from "../../../core/socle";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";

// Après le verrou, une question peut dépendre de la préconisation : sa condition
// lit les cibles figées, en plus des réponses. Ses pages sont marquées
// `afterLock`. Le questionnaire factice n'a pas de telle question, les pages
// sont donc écrites ici.

type Questions = {
  adresse: string;
  precision: string;
  douleur: "oui" | "non";
  endroit: string;
};

// Les cibles figées au verrou. Avant lui : aucune.
type Figees = { readonly urgence: Cible<boolean> };
type Cibles = Figees | undefined;

const OPTIONS = { douleur: { oui: "Oui", non: "Non" } } as const;

const given = givenOf<Questions, undefined, Figees>();

const question = questionsOf<Questions, undefined, Cibles>({
  options: OPTIONS,
});

const TOUJOURS = page("adresse", question.text("adresse", "Adresse"));

const SI_URGENCE = page(
  "urgence",
  question
    .text("precision", "Précision sur l'urgence")
    .mattersWhile(given.cible("urgence").isOui()),
);

const affichees = (urgence: boolean) =>
  new Questionnaire(
    afterLock({ id: "complement", title: "", pages: [TOUJOURS, SI_URGENCE] })
      .pages,
  )
    .readWith({}, { urgence: Cible.of(urgence) })
    .askedPages()
    .map((page) => page.id);

describe("condition d'une question sur les cibles", () => {
  it("pose la question quand la cible le demande", () => {
    expect(affichees(true)).toEqual(["adresse", "urgence"]);
  });

  it("ne la pose pas sinon", () => {
    expect(affichees(false)).toEqual(["adresse"]);
  });
});

// Un modèle demande au socle si une de ses parties est complète : c'est un fait
// que ses règles attendent.

const DOULEUR = page(
  "douleur",
  question.singleChoice("douleur", "Avez-vous mal ?"),
  question
    .text("endroit", "Où ?")
    .appliesWhen(given.question("douleur").answer().is("oui")),
);

const repondu = (reponses: Record<string, string>) =>
  new Questionnaire([DOULEUR]).readWith(reponses).isComplete();

describe("pages auxquelles tout est répondu", () => {
  it("le sont quand chaque question posée a sa réponse", () => {
    expect(repondu({ douleur: "oui", endroit: "Au dos" })).toBe(true);
  });

  it("le sont sans réponse à une question qui ne se pose pas", () => {
    expect(repondu({ douleur: "non" })).toBe(true);
  });

  it("ne le sont pas tant qu'une question posée attend", () => {
    expect(repondu({ douleur: "oui" })).toBe(false);
  });

  it("ne le sont pas pour une réponse hors des options", () => {
    expect(repondu({ douleur: "peut-être" })).toBe(false);
  });
});
