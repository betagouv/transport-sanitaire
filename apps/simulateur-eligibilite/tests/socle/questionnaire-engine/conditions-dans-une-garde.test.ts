// `answer()` dans une garde : les questions posées avant elle. Sur sa page,
// telles que saisies, si elles se posent ; sur les pages d'avant, validées.
// Une incohérence lit aussi sa propre question, et se déclare sur la plus
// tardive de celles qu'elle lit. Une cible se lit sur les faits de l'endroit,
// ou sous une hypothèse. Les pages sont écrites ici.

import { describe, expect, it } from "vitest";
import {
  Cible,
  type Condition,
  Fait,
  FaitCatalogue,
  givenOf,
  page,
  questionsOf,
  unFait,
} from "../../../core/socle";
import type {
  Answers,
  Page,
} from "../../../core/socle/questionnaire-engine/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";

type Questions = {
  boisson: "the" | "cafe" | "eau";
  taille: "petit" | "grand";
  sucre: boolean;
};
type Faits = { readonly chaude: Fait; readonly matin: Fait };
type Cibles = { readonly cible_sucre: Cible<boolean> };

const given = givenOf<Questions, Faits, Cibles>();

// Le sucre se propose pour une boisson chaude, une fois qu'on sait l'heure.
const question = questionsOf<Questions, Faits, Cibles>({
  options: {
    boisson: { the: "Un thé", cafe: "Un café", eau: "De l'eau" },
    taille: { petit: "Petit", grand: "Grand" },
  },
  faits: new FaitCatalogue<Faits>(
    ["chaude", "matin"],
    [
      unFait("chaude").vaut(
        given
          .question("boisson")
          .answer()
          .isOneOf("the", "cafe")
          .compute((chaude) =>
            chaude ? Fait.oui("Boisson chaude.") : Fait.non("Boisson froide."),
          ),
      ),
      unFait("matin").sinon("L'heure n'est pas demandée."),
    ],
  ),
  cibles: (faits) => ({
    cible_sucre: Cible.of(
      faits.matin.isInconnu() ? undefined : faits.chaude.isOui(),
    ),
  }),
});

const chaude = given.question("boisson").answer().isOneOf("the", "cafe");
const grand = given.question("taille").answer().is("grand");

const TAILLE = question.singleChoice("taille", "Quelle taille ?");
const BOISSON = question.singleChoice("boisson", "Quelle boisson ?");
const sucreSi = (condition: Condition) =>
  question.checkbox("sucre", "Du sucre ?", "Oui").appliesWhen(condition);

// Les questions posées sur ces pages, toutes pages confondues.
function posees(pages: readonly unknown[], answers: Answers): string[] {
  const lue = new Questionnaire(pages as Page[]).readWith(answers);
  return lue
    .askedPages()
    .flatMap((each) => lue.questionsOn(each).map(({ id }) => id));
}

describe("answer() dans une garde", () => {
  it("lit sa page telle que saisie, même sous une question vide", () => {
    const pages = [page("commande", TAILLE, BOISSON, sucreSi(chaude))];
    expect(posees(pages, { boisson: "the" })).toContain("sucre");
  });

  it("ne voit pas la réponse d'une question de sa page qui ne se pose plus", () => {
    const pages = [
      page("commande", TAILLE, BOISSON.appliesWhen(grand), sucreSi(chaude)),
    ];
    expect(posees(pages, { taille: "petit", boisson: "the" })).toEqual([
      "taille",
    ]);
  });

  it("lit les pages d'avant validées", () => {
    const pages = [
      page("taille", TAILLE),
      page("boisson", BOISSON),
      page("sucre", sucreSi(chaude)),
    ];
    expect(posees(pages, { boisson: "the" })).toEqual(["taille", "boisson"]);
    expect(posees(pages, { taille: "grand", boisson: "the" })).toContain(
      "sucre",
    );
  });

  it("lit telle quelle une réponse acquise avant le verrou, sans page ici", () => {
    expect(
      posees([page("sucre", sucreSi(chaude))], { boisson: "cafe" }),
    ).toEqual(["sucre"]);
  });

  it("sait quelles options se proposaient sur sa page", () => {
    const pages = [
      page("taille", TAILLE),
      page(
        "commande",
        BOISSON.option("eau", (option) => option.offeredWhen(grand)),
        sucreSi(given.question("boisson").answer().offered("eau")),
      ),
    ];
    expect(posees(pages, { taille: "petit" })).not.toContain("sucre");
    expect(posees(pages, { taille: "grand" })).toContain("sucre");
  });

  it("refuse de lire une question posée après elle", () => {
    const pages = [page("commande", sucreSi(chaude), BOISSON)];
    expect(() => posees(pages, {})).toThrow(
      "Une garde de sucre lit boisson, qui ne se pose pas avant elle.",
    );
  });
});

describe("answer() dans une incohérence", () => {
  const MESSAGE = "Un grand thé brûle : prenez un petit.";
  const trop = grand.and(chaude);

  it("lit aussi sa propre question, telle que saisie", () => {
    const TAILLE_BORNEE = TAILLE.inconsistentWhen(trop, MESSAGE);
    const pages = [page("boisson", BOISSON), page("taille", TAILLE_BORNEE)];
    const lue = new Questionnaire(pages as Page[]).readWith({
      boisson: "the",
      taille: "grand",
    });
    const [, taille] = lue.askedPages();
    const [posee] = lue.questionsOn(taille as Page);
    expect(posee?.inconsistencies).toEqual([MESSAGE]);
  });

  it("se déclare sur la plus tardive des questions qu'elle lit", () => {
    const pages = [
      page("taille", TAILLE.inconsistentWhen(trop, MESSAGE)),
      page("boisson", BOISSON),
    ];
    expect(() => posees(pages, {})).toThrow(
      "Une incohérence de taille lit boisson, qui se pose après : déclare-la sur boisson.",
    );
  });
});

describe("une cible dans une garde", () => {
  const sucreUtileSi = (condition: Condition) =>
    question.checkbox("sucre", "Du sucre ?", "Oui").mattersWhile(condition);

  it("se calcule sur les faits des questions validées avant elle", () => {
    const pages = [
      page("boisson", BOISSON),
      page("sucre", sucreUtileSi(given.cible("cible_sucre").isOui())),
    ];
    expect(posees(pages, { boisson: "the" })).toEqual(["boisson"]);
  });

  it("se lit sous une hypothèse, par assuming", () => {
    const supposee = given.cible("cible_sucre").assuming("matin").isOui();
    const pages = [
      page("boisson", BOISSON),
      page("sucre", sucreUtileSi(supposee)),
    ];
    expect(posees(pages, { boisson: "the" })).toEqual(["boisson", "sucre"]);
    expect(posees(pages, { boisson: "eau" })).toEqual(["boisson"]);
  });
});
