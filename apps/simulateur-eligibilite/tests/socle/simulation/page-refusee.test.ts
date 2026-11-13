// Une page ne se valide qu'entière et cohérente, même par un appel direct au
// moteur : `validate` lève `PageRefused`, avec les questions en faute et ce qui
// ne va pas dans chacune. Aucun résultat ne sort d'une page refusée
// (NAV-SOUS-QUESTIONS-20261113, SQ-30). Les pages sont écrites ici.

import { describe, expect, it } from "vitest";
import { givenOf, page, questionsOf } from "../../../core/socle";
import type { CoreModel } from "../../../core/socle/model";
import type {
  Page,
  QuestionnairePart,
} from "../../../core/socle/questionnaire-engine";
import { PageRefused, Simulation } from "../../../core/socle/simulation";

type Questions = { debut: string; fin: string; motif: string };

const question = questionsOf<Questions>();
const given = givenOf<Questions>();

const FIN_AVANT_LE_DEBUT = "La fin précède le début.";

const CRENEAU = page(
  "creneau",
  question.date("debut", "Début"),
  question
    .date("fin", "Fin")
    .inconsistentWhen(
      given
        .question("fin")
        .answer()
        .toDate()
        .isBefore(given.question("debut").answer().toDate()),
      FIN_AVANT_LE_DEBUT,
    ),
);

const MOTIF = page("motif", question.text("motif", "Quel motif ?"));

describe("une page refusée", () => {
  it("dit la question incohérente, et ne donne pas de résultat", () => {
    const surLeCreneau = Simulation.start(modele([CRENEAU]));

    const refus = refusDe(() => surLeCreneau.validate(FIN_AVANT));

    expect(refus.page).toBe("creneau");
    expect(refus.faults).toEqual([
      {
        question: "fin",
        problems: [{ kind: "stated", text: FIN_AVANT_LE_DEBUT }],
      },
    ]);
  });

  it("ne passe pas à la page suivante", () => {
    const surLeCreneau = Simulation.start(modele([CRENEAU, MOTIF]));

    expect(() => surLeCreneau.validate(FIN_AVANT)).toThrow(PageRefused);
  });

  it("dit la réponse qui manque", () => {
    const surLeCreneau = Simulation.start(modele([CRENEAU]));

    const refus = refusDe(() => surLeCreneau.validate({ debut: "2026-10-12" }));

    expect(refus.faults).toEqual([
      { question: "fin", problems: [{ kind: "missing" }] },
    ]);
  });

  it("laisse passer une page entière et cohérente", () => {
    const surLeCreneau = Simulation.start(modele([CRENEAU, MOTIF]));

    const suite = surLeCreneau.validate({
      debut: "2026-10-12",
      fin: "2026-10-13",
    });

    expect(suite.page.id).toBe("motif");
  });
});

// ---- implémentation ----

const FIN_AVANT = { debut: "2026-10-12", fin: "2026-10-11" };

function modele(pages: readonly unknown[]): CoreModel {
  return {
    preconisation: { faits: () => ({}), cibles: () => ({}), reads: new Map() },
    questionnaire: [
      { id: "partie", title: "Partie", pages: pages as Page[] },
    ] as QuestionnairePart<never, undefined>[],
    complement: { id: "complement", title: "Complément", pages: [] },
    seeds: async () => [],
  };
}

function refusDe(valider: () => unknown): PageRefused {
  try {
    valider();
  } catch (refus) {
    if (refus instanceof PageRefused) return refus;
    throw refus;
  }
  throw new Error("La page s'est validée.");
}
