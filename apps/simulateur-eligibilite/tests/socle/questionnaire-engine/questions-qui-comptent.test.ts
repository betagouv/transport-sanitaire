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
import { decisionGraphOf } from "../../../core/socle/decision-engine/publicodes-decision-engine.adapter";

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

  // La distance n'a sa première place que pour une consultation : pour un
  // séjour, elle se pose à sa place suivante (ADR-29), si la taille la suit.
  it("juge une place suivante à son propre rang", () => {
    const premiere = page("distance", DISTANCE.appliesWhen(CONSULTATION));
    const suivante = page("encore", DISTANCE.unlessAskedBefore());
    const motif = page("motif", MOTIF);
    const entree = page("entree", ENTREE);
    const taille = page("taille", TAILLE);
    const reponses = { motif: "sejour", entree: true } as const;

    expect(
      posees(reponses, [motif, premiere, entree, suivante, taille]),
    ).toEqual(["motif", "entree", "distance", "taille"]);
    expect(
      posees({ ...reponses, taille: "petit" }, [
        motif,
        premiere,
        entree,
        taille,
        suivante,
      ]),
    ).toEqual(["motif", "entree", "taille"]);
  });
});

// Une question masquée par le graphe garde ses gardes : elle n'est pas devenue
// inapplicable, et sa réponse reste (NAV-SOUS-QUESTIONS-20261113, D-293).
describe("une question que le graphe masque", () => {
  const SEJOUR = {
    motif: "sejour",
    distance: "loin",
    entree: true,
    taille: "grand",
  } as const;

  it("garde sa réponse quand une autre page la masque", () => {
    const apres = lire(SEJOUR).commit(PAGE_DU_MOTIF, { motif: "consultation" });

    expect(apres).toEqual({ motif: "consultation", distance: "loin" });
  });

  it("la retrouve quand elle compte de nouveau", () => {
    const masquee = lire(SEJOUR).commit(PAGE_DU_MOTIF, {
      motif: "consultation",
    });

    const reposee = lire(masquee).commit(PAGE_DU_MOTIF, { motif: "sejour" });

    expect(reposee).toEqual({ motif: "sejour", distance: "loin" });
  });

  it("garde sa réponse dans le brouillon de sa page", () => {
    const trajet = page("trajet", MOTIF, DISTANCE);
    const pages = [trajet, page("entree", ENTREE), page("taille", TAILLE)];

    const brouillon = lire({}, pages).answerOn(
      trajet,
      { motif: "sejour", distance: "loin" },
      "motif",
      "consultation",
    );

    expect(brouillon).toEqual({ motif: "consultation", distance: "loin" });
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
const CONSULTATION = given.question("motif").answer().is("consultation");
const REMARQUE = question
  .singleChoice("remarque", "Une remarque ?")
  .options({ oui: "Oui", non: "Non" });

// Une question par page : chacune se valide avant la suivante.
const PAGE_DU_MOTIF = page("motif", MOTIF);
const PAGES: readonly AnyPage[] = [
  PAGE_DU_MOTIF,
  page("distance", DISTANCE),
  page("entree", ENTREE),
  page("taille", TAILLE),
];

// Les questions posées, vu ces réponses.
function posees(
  reponses: Partial<Questions>,
  pages: readonly AnyPage[] = PAGES,
) {
  const read = lire(reponses, pages);
  return read
    .askedPages()
    .flatMap((each) => read.questionsOn(each).map(({ id }) => id));
}

// Ces réponses, lues avec la pertinence : le résultat ne montre que la taille.
function lire(reponses: Partial<Questions>, pages: readonly AnyPage[] = PAGES) {
  const relevance = new Relevance({
    graph: decisionGraphOf({ rien: { titre: "Rien" } }),
    pages,
    faits: { reads: FAITS.reads, imposed: [], of: () => ({}) },
    shown: given.question("taille").answer().reads,
  });
  return new Questionnaire(pages, relevance).readWith(reponses);
}
