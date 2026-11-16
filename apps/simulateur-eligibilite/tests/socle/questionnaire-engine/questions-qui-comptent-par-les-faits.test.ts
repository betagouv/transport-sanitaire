// Une question compte aussi par les faits qu'elle établit (#255) : quand le
// résultat lit un de ces faits, ou quand la garde d'une question qui reste lit
// une cible qui en dépend. Le graphe de décision dit de quels faits dépend la
// cible.

import { describe, expect, it } from "vitest";
import {
  Cible,
  type DeclaredPage,
  Fait,
  FaitCatalogue,
  page,
  QuestionFactory,
  Questionnaire,
  ReadingFactory,
  Relevance,
  unFait,
} from "../../../core/socle";
import { PublicodesGraphCompiler } from "../../../core/socle/decision-engine/publicodes-graph-compiler.adapter";
import type { Reads } from "../../../core/socle/questionnaire-engine";

describe("une question qui compte par les faits", () => {
  it("se pose quand le résultat lit un fait qu'elle établit", () => {
    expect(posees({}, given.fait("chaude").reads)).toEqual(["boisson"]);
  });

  it("ne se pose pas quand le résultat ne lit qu'une constante", () => {
    expect(posees({}, given.fait("matin").reads)).toEqual([]);
  });

  // Le résultat ne lit que le sucre. Le sucre se propose pour une boisson
  // chaude : la boisson décide de sa garde, par la cible.
  it("se pose quand elle décide d'une garde, par une cible", () => {
    const shown = given.question("sucre").answer().reads;

    expect(posees({}, shown)).toEqual(["boisson"]);
    expect(posees({ boisson: "the" }, shown)).toEqual(["boisson", "sucre"]);
  });
});

// ---- implémentation ----

type Questions = { boisson: "the" | "eau"; sucre: boolean };
type Faits = { readonly chaude: Fait; readonly matin: Fait };
type Cibles = { readonly cible_sucre_propose: Cible<boolean> };

const given = new ReadingFactory<Questions, Faits, Cibles>();

// `matin` ne lit rien : aucune question ne le change.
const FAITS = new FaitCatalogue<Faits>(
  ["chaude", "matin"],
  [
    unFait("chaude").vaut(
      given
        .question("boisson")
        .answer()
        .is("the")
        .compute((the) => (the ? Fait.oui("Du thé.") : Fait.non("De l'eau."))),
    ),
    unFait("matin").sinon("L'heure n'est pas demandée."),
  ],
);

// Les règles d'où vient la cible : le sucre se propose pour une boisson chaude.
const GRAPHE = new PublicodesGraphCompiler({
  chaude: { titre: "Boisson chaude" },
  matin: { titre: "Le matin" },
  cible_sucre_propose: { valeur: "chaude" },
}).compile();

const question = new QuestionFactory<Questions, Faits, Cibles>({
  faits: FAITS,
  cibles: (faits) => ({ cible_sucre_propose: Cible.of(faits.chaude.isOui()) }),
});

const BOISSON = question
  .singleChoice("boisson", "Quelle boisson ?")
  .possibleAnswers({ the: "Un thé", eau: "De l'eau" });
const SUCRE = question
  .checkbox("sucre", "Du sucre ?", "Oui")
  .appliesWhen(given.cible("cible_sucre_propose").isOui());

// Une question par page : chacune se valide avant la suivante.
const PAGES: readonly DeclaredPage<Questions, Cibles, Faits>[] = [
  page("boisson", BOISSON),
  page("sucre", SUCRE),
];

// Les questions posées, vu ces réponses, quand le résultat lit `shown`.
function posees(reponses: Partial<Questions>, shown: Reads) {
  const relevance = new Relevance({
    graph: GRAPHE,
    pages: PAGES,
    faits: {
      reads: FAITS.reads,
      imposed: [],
      of: (validated) => FAITS.read(validated),
    },
    shown,
  });
  const read = new Questionnaire(PAGES, relevance).readWith(reponses);
  return read
    .askedPages()
    .flatMap((each) => read.questionsOn(each).map(({ id }) => id));
}
