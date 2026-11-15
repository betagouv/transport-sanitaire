// Une date qui n'est pas au calendrier, comme le 31 février, est une erreur de
// la saisie elle-même : la page ne se valide pas, même par un appel direct au
// moteur (NAV-SOUS-QUESTIONS-20261113, SQ-27). À l'écran, le navigateur garde
// une telle date pour lui : `DateField` la signale par `badInput`, ce que
// jsdom ne simule pas. Les pages sont écrites ici.

import { describe, expect, it } from "vitest";
import { page, questionsOf } from "../../../core/socle";
import type { CoreModel } from "../../../core/socle/model";
import type {
  Answers,
  Page,
  QuestionnairePart,
} from "../../../core/socle/questionnaire-engine";
import { PageRefusal, Simulation } from "../../../core/socle/simulation";

type Questions = { jour: string; rendezVous: string };

const question = questionsOf<Questions>();

const AGENDA = page(
  "agenda",
  question.date("jour", "Quel jour ?"),
  question.datetime("rendezVous", "À quelle heure ?"),
);

const core: CoreModel = {
  preconisation: { faits: () => ({}), cibles: () => ({}), reads: new Map() },
  questionnaire: [
    { id: "partie", title: "Partie", pages: [AGENDA] as Page[] },
  ] as QuestionnairePart<never, undefined>[],
  complement: { id: "complement", title: "Complément", pages: [] },
  seeds: async () => [],
};

describe("une date impossible", () => {
  it("est une erreur de la saisie, avec ou sans heure", () => {
    expect(problemes({ jour: "2026-02-31" }, "jour")).toEqual([INVALIDE]);
    expect(problemes({ jour: "2026-02-29" }, "jour")).toEqual([INVALIDE]);
    expect(problemes({ rendezVous: "2026-02-30T08:30" }, "rendezVous")).toEqual(
      [INVALIDE],
    );
    expect(problemes({ rendezVous: "2026-02-28T24:00" }, "rendezVous")).toEqual(
      [INVALIDE],
    );
  });

  it("laisse passer une date du calendrier", () => {
    expect(problemes({ jour: "2028-02-29" }, "jour")).toEqual([]);
    expect(problemes({ rendezVous: "2026-02-28T08:30" }, "rendezVous")).toEqual(
      [],
    );
  });

  it("refuse la page, même par un appel direct au moteur", () => {
    const surLAgenda = Simulation.start(core);

    expect(() =>
      surLAgenda.validate({
        jour: "2026-02-31",
        rendezVous: "2026-02-28T08:30",
      }),
    ).toThrow(PageRefusal);
  });
});

// ---- implémentation ----

const INVALIDE = { kind: "invalid date" };

function problemes(brouillon: Answers, id: keyof Questions) {
  const simulation = Simulation.start(core);
  const posee = simulation
    .questionsOn(simulation.page, brouillon)
    .find((candidate) => candidate.id === id);
  if (!posee) throw new Error(`${id} n'est pas posée.`);
  return posee.formatProblemsWith(brouillon[id]);
}
