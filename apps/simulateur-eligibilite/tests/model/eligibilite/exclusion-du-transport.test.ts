// L'exclusion du transport, constatée par le logiciel sans question (D-105) :
// trois parcours creux de `tests/test_cinq_retours_a.mjs` du paquet, sous leur
// identifiant chez l'éditeur, et `CONTRAT_NEGATIONS_PROUVEES.json`.
//
// Le parcours part de nos faits : brancard, 20 km, Q2.2.1 « Aucune ». P2 y est
// complète, par les réponses (D-110). Les quinze autres parcours
// creux portent sur Q2.2.1, la convocation, l'ALD, la série et l'article 80 :
// ils arrivent avec leurs questions.

import { describe, expect, it } from "vitest";
import { model } from "../../../core/models/eligibilite";
import type { Faits } from "../../../core/models/eligibilite/declarations/faits";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import { cibles } from "../../../core/models/eligibilite/evaluation-des-regles";
import type { Fait } from "../../../core/socle";
import { preconisationOf } from "../../../core/socle/model";
import type { Answers } from "../../../core/socle/questionnaire-engine/question";

const BRANCARD_20_KM: Answers<Questions> = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "3_AVEC_UN_PROFESSIONNEL",
  "Q1.2": ["8_BRANCARDAGE"],
  "Q1.3": ["7_AUCUNE"],
  "Q2.2.1": ["4_AUCUNE"],
  "Q2.3.1": "1_CINQUANTE_KM_OU_MOINS",
  "Q2.3.2": false,
};
const nos = preconisationOf(model, BRANCARD_20_KM).faits as Faits;

const issue = (exclusion: Fait) =>
  cibles({
    ...nos,
    fait_exclusion_transport_prouvee: exclusion,
  }).cible_issue_id;

describe("l'exclusion du transport", () => {
  it("vaut « non », constatée par le logiciel, sans question", () => {
    expect(nos.fait_exclusion_transport_prouvee).toEqual({
      value: false,
      provenance: expect.stringMatching(/^Contrôle du logiciel/),
    });
  });

  it("brancard-20km-aucune : ISSUE_PMT, sans fait inventé", () => {
    expect(issue(nos.fait_exclusion_transport_prouvee)).toBe("ISSUE_PMT");
    const sansPreuve = Object.entries(nos).filter(
      ([fait, { value }]) =>
        value !== undefined &&
        (fait.startsWith("fait_exception_article80_") ||
          [
            "fait_urgence_attestee",
            "fait_urgence_repondue",
            "fait_regime_verifie",
            "fait_hospitalisation",
            "fait_ald_exonerante_3_ou_4",
          ].includes(fait)),
    );
    expect(sansPreuve).toEqual([]);
  });

  it("exclusions-indeterminees : sans constat, aucune issue", () => {
    expect(issue({ provenance: "Aucun constat." })).toBeUndefined();
  });

  it("exclusion-positive-sourcee : une exclusion prouvée, ISSUE_NON_ELIGIBLE", () => {
    expect(issue({ value: true, provenance: "Règle d'exclusion." })).toBe(
      "ISSUE_NON_ELIGIBLE",
    );
  });
});
