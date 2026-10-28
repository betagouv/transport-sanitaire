// Ce que change une question : les faits qui la lisent, et ceux des questions
// dont une garde la lit, de proche en proche (#254). Le modèle factice montre
// le lien par une garde de question. Les pages et les règles écrites ici
// montrent celui par une garde d'option, par une cible, et la constante.

import { describe, expect, it } from "vitest";
import {
  Cible,
  Fait,
  FaitCatalogue,
  givenOf,
  questionsOf,
  unFait,
} from "../../../core/socle";
import { DecisionGraph } from "../../../core/socle/decision-engine/decision-graph";
import { decisionGraphOf } from "../../../core/socle/decision-engine/publicodes";
import { faitsChangedBy } from "../../../core/socle/questionnaire-engine/faits-changed-by";
import { pagesOf } from "../../../core/socle/questionnaire-engine/question";
import { faitsDeTest, modeleDeTest } from "../modele-de-test";

describe("ce que change une question", () => {
  it("passe par la garde d'une autre question", () => {
    const { questionnaire, complement } = modeleDeTest.core;
    const questions = [...pagesOf(questionnaire), ...complement.pages].flatMap(
      (each) => each.questions,
    );
    // Le modèle factice n'a pas de règles : ses gardes ne lisent pas de cible.
    const sansRegles = new DecisionGraph(decisionGraphOf({}));

    const changes = faitsChangedBy(questions, faitsDeTest, sansRegles);

    // `accompagnements` ne se pose que pour une boisson : sa garde lit
    // `boisson`, qui change donc le fait qui lit `accompagnements`.
    expect(Object.fromEntries(changes)).toEqual({
      boisson: ["boisson", "accompagnements"],
      accompagnements: ["accompagnements"],
      quantite: [],
    });
  });

  it("passe par la garde d'une option, et ne change pas une constante", () => {
    const changes = faitsChangedBy(
      [TAILLE, BOISSON.option("eau", (option) => option.offeredWhen(grand))],
      FAITS,
      GRAPHE,
    );

    expect(changes.get("taille")).toEqual(["chaude"]);
    expect(changes.get("boisson")).toEqual(["chaude"]);
  });

  it("passe par une cible, jusqu'aux faits dont elle dépend", () => {
    const changes = faitsChangedBy([TAILLE, BOISSON, SUCRE], FAITS, GRAPHE);

    // Le sucre se propose pour une boisson chaude : `boisson` change aussi le
    // fait qui lit `sucre`.
    expect(changes.get("boisson")).toEqual(["chaude", "sucre"]);
    expect(changes.get("taille")).toEqual([]);
  });
});

// ---- implémentation ----

type Questions = {
  boisson: "the" | "eau";
  taille: "petit" | "grand";
  sucre: boolean;
};
type Faits = {
  readonly chaude: Fait;
  readonly sucre: Fait;
  readonly matin: Fait;
};
type Cibles = { readonly cible_sucre_propose: Cible<boolean> };

const given = givenOf<Questions, Faits, Cibles>();

// `matin` ne lit rien : aucune question ne le change.
const FAITS = new FaitCatalogue<Faits>(
  ["chaude", "sucre", "matin"],
  [
    unFait("chaude").vaut(
      given
        .question("boisson")
        .answer()
        .is("the")
        .compute((the) => (the ? Fait.oui("Du thé.") : Fait.non("De l'eau."))),
    ),
    unFait("sucre").vaut(
      given
        .question("sucre")
        .answer()
        .is(true)
        .compute((avec) => (avec ? Fait.oui("Sucré.") : Fait.non("Nature."))),
    ),
    unFait("matin").sinon("L'heure n'est pas demandée."),
  ],
);

// Les règles d'où vient la cible : le sucre se propose pour une boisson chaude.
const GRAPHE = new DecisionGraph(
  decisionGraphOf({
    chaude: { titre: "Boisson chaude" },
    sucre: { titre: "Sucré" },
    matin: { titre: "Le matin" },
    cible_sucre_propose: { valeur: "chaude" },
  }),
);

const question = questionsOf<Questions, Faits, Cibles>({
  options: {
    boisson: { the: "Un thé", eau: "De l'eau" },
    taille: { petit: "Petit", grand: "Grand" },
  },
  faits: FAITS,
  cibles: (faits) => ({ cible_sucre_propose: Cible.of(faits.chaude.isOui()) }),
});

const grand = given.question("taille").answer().is("grand");
const TAILLE = question.singleChoice("taille", "Quelle taille ?");
const BOISSON = question.singleChoice("boisson", "Quelle boisson ?");
const SUCRE = question
  .checkbox("sucre", "Du sucre ?", "Oui")
  .appliesWhen(given.cible("cible_sucre_propose").isOui());
