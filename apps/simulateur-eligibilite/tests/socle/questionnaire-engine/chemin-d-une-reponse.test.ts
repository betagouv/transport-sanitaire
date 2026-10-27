// Le chemin d'une réponse jusqu'à une garde : réponses → validées → faits →
// cibles. Une garde lit les cibles que le modèle calcule sur les faits des
// questions validées avant elle. Seules les pages posées après le verrou
// lisent les cibles figées.

import { describe, expect, it } from "vitest";
import {
  afterLock,
  Cible,
  FaitCatalogue,
  givenOf,
  page,
  questionsOf,
  unFait,
} from "../../../core/socle";
import type { Page } from "../../../core/socle/questionnaire-engine/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";

type Questions = { boisson: "the" | "cafe" | "eau"; sucre: boolean };
type Faits = { readonly chaude: boolean };
type Cibles = { readonly cible_sucre_propose: Cible<boolean> };

let calculs = 0;

const given = givenOf<Questions, Faits, Cibles>();

const question = questionsOf<Questions, Faits, Cibles>({
  options: { boisson: { the: "Un thé", cafe: "Un café", eau: "De l'eau" } },
  faits: new FaitCatalogue<Faits>(
    ["chaude"],
    [
      unFait("chaude").vaut(
        given.question("boisson").answer().isOneOf("the", "cafe"),
      ),
    ],
  ),
  cibles: (faits) => {
    calculs += 1;
    return { cible_sucre_propose: Cible.of(faits.chaude) };
  },
});

const BOISSON = page(
  "boisson",
  question.singleChoice("boisson", "Quelle boisson ?"),
);

const SUCRE = page(
  "sucre",
  question
    .checkbox("sucre", "Du sucre ?", "Oui")
    .mattersWhile(given.cible("cible_sucre_propose").isOui()),
);

const [SUCRE_DU_COMPLEMENT] = afterLock({
  id: "complement",
  title: "Le complément",
  pages: [SUCRE],
}).pages;

const FIGEES: Cibles = { cible_sucre_propose: Cible.of(false) };

const poseesSur = (
  sucre: Page,
  boisson: Questions["boisson"],
  cibles?: Cibles,
): readonly string[] =>
  new Questionnaire([BOISSON, sucre] as readonly Page[])
    .readWith({ boisson }, cibles)
    .questionsOn(sucre)
    .map(({ id }) => id);

describe("une garde qui lit les cibles", () => {
  it("lit celles que le modèle calcule sur ses faits", () => {
    expect(poseesSur(SUCRE as Page, "the")).toEqual(["sucre"]);
    expect(poseesSur(SUCRE as Page, "eau")).toEqual([]);
  });

  it("les calcule encore, relue après le verrou", () => {
    expect(poseesSur(SUCRE as Page, "the", FIGEES)).toEqual(["sucre"]);
  });

  it("lit les cibles figées, posée après le verrou", () => {
    expect(poseesSur(SUCRE_DU_COMPLEMENT as Page, "the", FIGEES)).toEqual([]);
  });

  it("ne les fait calculer que si elle les lit", () => {
    calculs = 0;
    new Questionnaire([BOISSON] as readonly Page[])
      .readWith({ boisson: "the" })
      .questionsOn(BOISSON as Page);
    expect(calculs).toBe(0);
  });
});
