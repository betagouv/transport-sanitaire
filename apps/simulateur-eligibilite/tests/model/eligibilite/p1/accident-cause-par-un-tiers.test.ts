// L'accident causé par un tiers, recueilli en Q1.3 avec sa date
// (QST-Q13-TIERS-20261104, `CONTRAT_Q13_ACCIDENT_TIERS.json`, #351). Il ne
// sert qu'aux cerfa : aucune cible ne le lit.

import { describe, expect, it } from "vitest";
import { model } from "../../../../core/models/eligibilite";
import type { Questions } from "../../../../core/models/eligibilite/questions/reponses";
import { cibleValues } from "../../../../core/socle/decision-engine";
import {
  type Answers,
  pagesOf,
  Questionnaire,
} from "../../../../core/socle/questionnaire-engine";
import { EstablishAPreconisation } from "../../../../core/socle/simulation";

type Reponses = Answers<Questions>;

const pages = pagesOf(model.questionnaire);
const P1_3 = pages.find(({ id }) => id === "P1/3");
if (!P1_3) throw new Error("P1/3 n'existe pas");

const DATE = "Q1.3.accident_tiers_date";

// Un patient seul, qui vient en véhicule personnel.
const SEUL: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "1_SEUL",
  "Q1.3": ["7_AUCUNE"],
  "Q1.4": "1_VEHICULE_PERSONNEL",
};
const AVEC_UN_TIERS: Reponses = {
  ...SEUL,
  "Q1.3": ["9_ACCIDENT_TIERS"],
  [DATE]: "2026-09-30",
};

const lecture = (reponses: Reponses) =>
  new Questionnaire(pages).readWith(reponses);
const date = (reponses: Reponses) =>
  lecture(reponses)
    .questionsOn(P1_3)
    .find(({ id }) => id === DATE);

describe("l'accident causé par un tiers en Q1.3", () => {
  it("propose sa case après le transport partagé, avant « Aucune »", () => {
    const q13 = lecture(SEUL)
      .questionsOn(P1_3)
      .find(({ id }) => id === "Q1.3");
    const options =
      q13?.kind === "multiple choice"
        ? q13.options.map(({ value }) => value)
        : [];

    expect(options.at(-1)).toBe("9_ACCIDENT_TIERS");
    expect(q13?.kind === "multiple choice" && q13.exclusiveOption?.value).toBe(
      "7_AUCUNE",
    );
  });

  it("demande sa date sur la même page, seulement si la case est cochée", () => {
    expect(date(SEUL)).toBeUndefined();
    expect(date(AVEC_UN_TIERS)?.label).toBe(
      "À quelle date cet accident a-t-il eu lieu ?",
    );
  });

  it("attend la date pour valider la page", () => {
    const { [DATE]: _, ...sansDate } = AVEC_UN_TIERS;

    expect(lecture(sansDate).openPage().id).toBe("P1/3");
    expect(lecture(AVEC_UN_TIERS).openPage().id).not.toBe("P1/3");
    expect(lecture(AVEC_UN_TIERS).validated.question(DATE).value).toBe(
      "2026-09-30",
    );
  });

  it("refuse en elle-même une date future, et accepte aujourd'hui", () => {
    const avec = (jour: string) =>
      date({ ...AVEC_UN_TIERS, [DATE]: jour })?.formatProblemsWith(jour);

    expect(avec("2999-01-01")).toEqual([
      { kind: "date after", max: aujourdhui() },
    ]);
    expect(avec(aujourdhui())).toEqual([]);
    expect(avec("2020-01-01")).toEqual([]);
  });

  it("ne change aucune cible", () => {
    const cibles = (reponses: Reponses) =>
      cibleValues(new EstablishAPreconisation(model).execute(reponses).cibles);

    expect(cibles(AVEC_UN_TIERS)).toEqual(cibles(SEUL));
  });
});

// ---- implémentation ----

// Le jour civil à Paris, comme la borne de la date.
const aujourdhui = () =>
  new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
