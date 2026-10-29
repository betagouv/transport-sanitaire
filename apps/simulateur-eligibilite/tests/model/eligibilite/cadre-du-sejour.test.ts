// Le cadre du séjour en cours, « déjà hospitalisé » coché : un établissement de
// santé ou une Hospitalisation à Domicile (TS1014-B01, `CONTRAT_CONTEXTES_V1012.json`).
// Une HAD écarte la permission et laisse l'article 80 à Q2.6 ; seul un séjour
// en établissement établit l'hospitalisation.

import { describe, expect, it } from "vitest";
import { model } from "../../../core/models/eligibilite";
import type { Faits } from "../../../core/models/eligibilite/declarations/faits";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import { preconisationOf } from "../../../core/socle/model";
import {
  type Answers,
  pagesOf,
} from "../../../core/socle/questionnaire-engine/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";

type Reponses = Answers<Questions>;

const pages = pagesOf(model.questionnaire);
const faits = (reponses: Reponses) =>
  preconisationOf(model, reponses).faits as Faits;

const CONSULTATION: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "1_SEUL",
  "Q1.3": ["7_AUCUNE"],
  "Q1.4": "1_VEHICULE_PERSONNEL",
  "Q2.1": "1_CONSULTATION",
};

describe("le cadre du séjour (Q2.2.1.cadre, TS1014-B01)", () => {
  const posees = (reponses: Reponses) =>
    pages
      .flatMap((suivante) =>
        new Questionnaire(pages).readWith(reponses).questionsOn(suivante),
      )
      .map(({ id }) => id);
  const sejour = (plus: Reponses): Reponses => ({
    ...CONSULTATION,
    "Q2.2.1": ["1_HOSPITALISATION"],
    "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
    "Q2.3.2": false,
    ...plus,
  });
  const HAD = sejour({ "Q2.2.1.cadre": "2_HAD" });

  it("se demande sous « déjà hospitalisé », avant la permission", () => {
    const ids = posees(sejour({}));
    expect(ids).toContain("Q2.2.1.cadre");
    expect(ids).not.toContain("Q2.2.1.a");
  });

  it("ne se demande pas quand une sortie d'établissement le dit déjà", () => {
    const ids = posees(
      sejour({ "Q2.1": "8_HOSPITALISATION", "Q2.1.g": "2_SORTIE" }),
    );
    expect(ids).not.toContain("Q2.2.1.cadre");
    expect(ids).toContain("Q2.2.1.a");
  });

  it("en établissement, garde la question de la permission", () => {
    expect(posees(sejour({ "Q2.2.1.cadre": "1_ETABLISSEMENT" }))).toContain(
      "Q2.2.1.a",
    );
  });

  it("en HAD, ne pose ni Q2.2.1.a, ni Q2.7, ni Q2.8", () => {
    const ids = posees(HAD);
    expect(ids.filter((id) => /^Q2\.(2\.1\.a|7|8)/.test(id))).toEqual([]);
  });

  it("en HAD, écarte la permission et n'établit pas l'hospitalisation", () => {
    expect(faits(HAD).fait_permission.value).toBe(false);
    expect(faits(HAD).fait_hospitalisation.value).toBeUndefined();
  });

  it("en établissement, établit l'hospitalisation", () => {
    const etablissement = sejour({ "Q2.2.1.cadre": "1_ETABLISSEMENT" });
    expect(faits(etablissement).fait_hospitalisation.value).toBe(true);
  });
});
