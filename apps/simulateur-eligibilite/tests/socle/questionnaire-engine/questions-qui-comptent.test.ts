// Le filtrage par le graphe (#255) : une question ne se pose que si sa réponse
// change ce que montre le résultat (D-220), ou la garde d'une question qui
// reste, peut encore se poser et compte elle-même (D-221, D-223).
//
// Ici, le résultat ne montre que la taille. La distance n'en change que les
// options, et la taille ne se pose que pour une entrée en établissement, qui ne
// se demande que pour un séjour.

import { describe, expect, it } from "vitest";
import {
  type Cible,
  type DeclaredPage,
  type Fait,
  FaitCatalogue,
  givenOf,
  page,
  Questionnaire,
  questionsOf,
  Relevance,
  unFait,
} from "../../../core/socle";
import { decisionGraphOf } from "../../../core/socle/decision-engine/compute-the-cibles";

describe("les questions qui comptent", () => {
  it("pose la distance quand la taille peut encore se poser", () => {
    expect(posees({ motif: "sejour" })).toEqual([
      "motif",
      "distance",
      "entree",
    ]);
  });

  it("saute la distance quand la taille ne peut plus se poser", () => {
    // Pour une consultation, l'entrée ne se pose pas, donc la taille non plus.
    expect(posees({ motif: "consultation" })).toEqual(["motif"]);
  });

  it("pose une question toujours posée, même si rien ne la lit", () => {
    const pages = [...PAGES, page("remarque", REMARQUE.alwaysAsked())];
    const reponses = { motif: "consultation" } as const;

    expect(posees(reponses, pages)).toEqual(["motif", "remarque"]);
  });
});

// ---- implémentation ----

type Questions = {
  motif: "consultation" | "sejour";
  distance: "pres" | "loin";
  entree: boolean;
  taille: "petit" | "grand";
  remarque: "oui" | "non";
};
type Faits = { readonly rien: Fait };
type Cibles = Record<string, Cible<boolean>>;
type AnyPage = DeclaredPage<Questions, Cibles, Faits>;

const given = givenOf<Questions, Faits, Cibles>();

const FAITS = new FaitCatalogue<Faits>(
  ["rien"],
  [unFait("rien").sinon("Aucune question ne le dit.")],
);

const question = questionsOf<Questions, Faits, Cibles>({
  faits: FAITS,
  cibles: () => ({}),
});

const MOTIF = question
  .singleChoice("motif", "Pour quoi ?")
  .options({ consultation: "Une consultation", sejour: "Un séjour" });
const DISTANCE = question
  .singleChoice("distance", "À quelle distance ?")
  .options({ pres: "Près", loin: "Loin" });
const ENTREE = question
  .checkbox("entree", "Une entrée ?", "Oui")
  .appliesWhen(given.question("motif").answer().is("sejour"));
const TAILLE = question
  .singleChoice("taille", "Quelle taille ?")
  .options({ petit: "Petit", grand: "Grand" })
  .appliesWhen(given.question("entree").answer().is(true))
  .option("grand", (option) =>
    option.offeredWhen(given.question("distance").answer().is("loin")),
  );
const REMARQUE = question
  .singleChoice("remarque", "Une remarque ?")
  .options({ oui: "Oui", non: "Non" });

// Une question par page : chacune se valide avant la suivante.
const PAGES: readonly AnyPage[] = [
  page("motif", MOTIF),
  page("distance", DISTANCE),
  page("entree", ENTREE),
  page("taille", TAILLE),
];

// Les questions posées, vu ces réponses.
function posees(
  reponses: Partial<Questions>,
  pages: readonly AnyPage[] = PAGES,
) {
  const relevance = new Relevance({
    graph: decisionGraphOf({ rien: { titre: "Rien" } }),
    pages,
    faits: { reads: FAITS.reads, imposed: [], of: () => ({}) },
    shown: given.question("taille").answer().reads,
  });
  const read = new Questionnaire(pages, relevance).readWith(reponses);
  return read
    .askedPages()
    .flatMap((each) => read.questionsOn(each).map(({ id }) => id));
}
