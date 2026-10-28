// Ce que change une question du modèle de l'éditeur : les faits qui la lisent,
// et ceux des questions dont une garde la lit, ou lit une cible qu'elle change
// (#254). Rien ne se déclare : le lien se lit sur les faits, les gardes et le
// graphe de décision.

import { describe, expect, it } from "vitest";
import { model } from "../../../core/models/eligibilite";
import { CATALOGUE_DES_FAITS } from "../../../core/models/eligibilite/faits";
import GRAPHE from "../../../core/models/eligibilite/rules/regles.graphe.json";
import type { DecisionGraphData } from "../../../core/socle/decision-engine/decision-graph";
import { DecisionGraph } from "../../../core/socle/decision-engine/decision-graph";
import { faitsChangedBy } from "../../../core/socle/questionnaire-engine/faits-changed-by";
import { pagesOf } from "../../../core/socle/questionnaire-engine/question";

const questions = [
  ...pagesOf(model.questionnaire),
  ...model.complement.pages,
].flatMap((each) => each.questions);

const changes = faitsChangedBy(
  questions,
  CATALOGUE_DES_FAITS,
  new DecisionGraph(GRAPHE as DecisionGraphData),
);

describe("ce que change une question du modèle", () => {
  // La distance décide aussi si l'urgence se demande (Q2.3.4, Q2.12) : leur
  // garde lit `cible_question_urgence_a_afficher`, qui dépend des seuils.
  it("Q2.3.1, la distance, change les seuils, la série et l'urgence", () => {
    expect(changes.get("Q2.3.1")).toEqual([
      "fait_distance_plus_50",
      "fait_distance_plus_150",
      "fait_serie_qualifiante",
      "fait_dap_maternite",
      "fait_urgence_attestee",
      "fait_urgence_repondue",
      "fait_transfert_article80",
      "fait_centre15_interetablissements",
    ]);
  });

  // Une ligne régulière retire l'exception « air ou mer » au transfert : le
  // choix de l'exception, et ce qui le lit, en dépendent.
  it("Q2.3.2, l'avion ou le bateau, change aussi le transfert", () => {
    expect(changes.get("Q2.3.2")).toEqual([
      "fait_avion_bateau_ligne",
      "fait_appel_centre15",
      "fait_dap_maternite",
      "fait_urgence_attestee",
      "fait_urgence_repondue",
      "fait_transfert_article80",
      "fait_exception_article80_admission_sans_sejour",
      "fait_exception_article80_air_mer",
      "fait_exception_article80_had_intercurrent",
      "fait_exception_article80_usld",
      "fait_exception_article80_ehpad",
      "fait_exception_article80_radiotherapie",
      "fait_exception_article80_dialyse_domicile",
      "fait_exception_article80_admission_had",
      "fait_centre15_interetablissements",
    ]);
  });

  it("Q2.3.3, la série de transports, change la série et l'urgence", () => {
    expect(changes.get("Q2.3.3")).toEqual([
      "fait_serie_qualifiante",
      "fait_dap_maternite",
      "fait_urgence_attestee",
      "fait_urgence_repondue",
      "fait_transfert_article80",
      "fait_centre15_interetablissements",
    ]);
  });
});
