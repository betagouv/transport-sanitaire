// Une question à plusieurs places (ADR-29) : déclarée sur deux pages, sous une
// seule réponse. Elle se pose à la première place où ses gardes tiennent ; la
// seconde ne la repose pas. Une place cachée ne lui fait perdre sa réponse que
// si c'est la dernière, et qu'aucune place d'avant ne la pose. Les pages sont
// écrites ici.
//
// L'urgence se pose au trajet pour un trajet long, et à la branche quand la
// branche la rend utile.

import { describe, expect, it } from "vitest";
import { afterLock, givenOf, page, questionsOf } from "../../../core/socle";
import type { Answers } from "../../../core/socle/questionnaire-engine/question/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";

describe("une question à plusieurs places", () => {
  it("se pose à sa première place, quand ses gardes y tiennent", () => {
    expect(posees({ trajet: "long", urgence: "non", branche: "oui" })).toEqual([
      "trajet/trajet",
      "trajet/urgence",
      "branche/branche",
      "suite/dependante",
    ]);
  });

  it("se pose à la seconde, quand la première ne la pose pas", () => {
    expect(posees({ trajet: "court", branche: "oui" })).toEqual([
      "trajet/trajet",
      "branche/branche",
      "branche/urgence",
      "suite/dependante",
    ]);
  });

  it("n'a qu'une réponse, validée à la place où elle se pose", () => {
    const lue = lire({ ...BRANCHE_URGENTE, urgence: "non" });

    expect(lue.validated.toJSON().urgence).toEqual({
      offered: ["oui", "non"],
      answer: "non",
    });
    expect(lue.isComplete()).toBe(true);
  });

  it("répondue à la seconde, se pose à la première qu'une correction rend utile, déjà répondue", () => {
    const corrigee = lire(BRANCHE_URGENTE).commit(TRAJET, {
      trajet: "long",
      urgence: "oui",
    });

    expect(corrigee).toEqual({ ...BRANCHE_URGENTE, trajet: "long" });
    expect(posees(corrigee)).toEqual([
      "trajet/trajet",
      "trajet/urgence",
      "entre/entre",
      "branche/branche",
      "suite/dependante",
    ]);
  });

  it("une garde entre ses deux places lit sa réponse validée", () => {
    expect(posees({ trajet: "long", urgence: "oui" })).toContain("entre/entre");
    expect(posees({ trajet: "court", urgence: "oui" })).not.toContain(
      "entre/entre",
    );
  });
});

describe("la validation d'une page où elle ne se pose pas", () => {
  it("garde sa réponse à une première place cachée : la suivante peut la poser", () => {
    expect(
      lire(BRANCHE_URGENTE).commit(TRAJET, { trajet: "court", urgence: "oui" }),
    ).toEqual(BRANCHE_URGENTE);
  });

  it("garde sa réponse, en attente, quand une correction la cache à la première", () => {
    const corrigee = lire({
      trajet: "long",
      urgence: "non",
      branche: "oui",
    }).commit(TRAJET, { trajet: "court", urgence: "non" });

    expect(corrigee).toHaveProperty("urgence", "non");
    expect(lire(corrigee).validated.toJSON().urgence?.answer).toBe("non");
    expect(
      lire({ ...corrigee, branche: "non" }).validated.toJSON(),
    ).not.toHaveProperty("urgence");
  });

  it("garde sa réponse à la dernière place, quand une place d'avant la pose : elle n'a pas changé", () => {
    const reponses = {
      trajet: "long",
      urgence: "oui",
      entre: "e",
      branche: "oui",
      dependante: "d",
    } as const;

    expect(
      lire(reponses).commit(BRANCHE, { branche: "oui", urgence: "oui" }),
    ).toEqual(reponses);
  });

  it("la perd à la dernière place, quand aucune place d'avant ne la pose", () => {
    expect(
      lire(BRANCHE_URGENTE).commit(BRANCHE, { branche: "non", urgence: "oui" }),
    ).toEqual({ trajet: "court", branche: "non" });
  });
});

describe("la déclaration de ses places", () => {
  it("refuse une place suivante sans première", () => {
    expect(
      () => new Questionnaire([page("branche", URGENCE.unlessAskedBefore())]),
    ).toThrow("urgence est une place suivante");
  });

  it("refuse deux places sur une même page", () => {
    expect(
      () =>
        new Questionnaire([
          page("trajet", URGENCE, URGENCE.unlessAskedBefore()),
        ]),
    ).toThrow("urgence a deux places sur la page trajet.");
  });

  it("refuse un id répété qui ne se dit pas place suivante", () => {
    expect(
      () =>
        new Questionnaire([page("trajet", URGENCE), page("branche", URGENCE)]),
    ).toThrow("urgence se déclare deux fois");
  });

  it("refuse des places de part et d'autre du verrou", () => {
    const apres = afterLock({
      pages: [page("complement", URGENCE.unlessAskedBefore())],
    });

    expect(
      () => new Questionnaire([page("trajet", URGENCE), ...apres.pages]),
    ).toThrow("urgence a une place de chaque côté du verrou");
  });

  it("arrête une garde qui lit sa propre question à une place suivante", () => {
    const seLit = URGENCE.unlessAskedBefore().appliesWhen(
      given.question("urgence").answer().is("oui"),
    );
    const pages = [TRAJET, page("branche", seLit)];

    expect(() =>
      new Questionnaire(pages).readWith({ trajet: "court" }),
    ).toThrow("Une garde de urgence lit urgence");
  });
});

// ---- implémentation ----

type Questions = {
  trajet: "court" | "long";
  urgence: "oui" | "non";
  entre: string;
  branche: "oui" | "non";
  dependante: string;
};

const question = questionsOf<Questions>();
const given = givenOf<Questions>();

const URGENCE = question
  .singleChoice("urgence", "Urgent ?")
  .options({ oui: "Oui", non: "Non" });

const TRAJET = page(
  "trajet",
  question
    .singleChoice("trajet", "Quel trajet ?")
    .options({ court: "Court", long: "Long" }),
  URGENCE.appliesWhen(given.question("trajet").answer().is("long")),
);
const BRANCHE = page(
  "branche",
  question
    .singleChoice("branche", "Une branche ?")
    .options({ oui: "Oui", non: "Non" }),
  URGENCE.unlessAskedBefore().appliesWhen(
    given.question("branche").answer().is("oui"),
  ),
);
const PAGES = [
  TRAJET,
  page(
    "entre",
    question
      .text("entre", "Entre les deux ?")
      .appliesWhen(given.question("urgence").answer().is("oui")),
  ),
  BRANCHE,
  page("suite", question.text("dependante", "Ensuite ?").dependsOn("urgence")),
];

// L'urgence répondue à la branche, pour un trajet court.
const BRANCHE_URGENTE = {
  trajet: "court",
  branche: "oui",
  urgence: "oui",
  dependante: "d",
} as const;

function lire(reponses: Answers<Questions>) {
  return new Questionnaire(PAGES).readWith(reponses);
}

// Les questions posées, par page.
function posees(reponses: Answers<Questions>): string[] {
  const lue = lire(reponses);
  return lue
    .askedPages()
    .flatMap((each) =>
      lue.questionsOn(each).map(({ id }) => `${each.id}/${id}`),
    );
}
