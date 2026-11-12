// L'événement sans soin (FAIT-EVENEMENT-SANS-SOIN-20261112, v10.1.8) : seule
// une qualification positive du même trajet l'établit. « Autre motif » seul
// n'établit rien (D-282).

import { describe, expect, it } from "vitest";
import { MATERNITE_ETABLIE } from "./reponses-de-la-branche";
import { appareillage, CONVOQUE } from "./reponses-de-la-convocation";
import {
  ciblesDe,
  faits,
  MINEUR,
  PATIENT_SEUL,
  type Reponses,
  SANS_SITUATION,
} from "./reponses-de-la-permission";

describe("l'événement sans soin", () => {
  it.each<[string, Reponses]>([
    ["une permission d'un mineur, admissible", MINEUR],
    [
      "une permission d'un adulte, autorisée",
      { ...PATIENT_SEUL, "Q2.7": "3_ADULTE_AUTORISEE" },
    ],
    [
      "un transport exceptionnel demandé par l'adulte, confirmé",
      { ...PATIENT_SEUL, "Q2.7": "4_ADULTE_A_SA_CHARGE", "Q2.7.a": "1_OUI" },
    ],
    ["une convocation", { ...CONVOQUE, "Q2.10": "1_CONTROLE_MEDICAL" }],
    ["un appareillage visé", appareillage("1_OUI", "2_PODO_ORTHESE")],
    ["l'Engagement maternité", MATERNITE_ETABLIE],
  ])("%s l'établit", (_, reponses) => {
    expect(evenement(reponses)).toBe(true);
  });

  it("« Autre motif » seul n'établit rien, et le transport n'est pas pris en charge", () => {
    expect(evenement(SANS_SITUATION)).toBeUndefined();
    expect(ciblesDe(SANS_SITUATION).cible_issue_id.value).toBe(
      "ISSUE_NON_ELIGIBLE",
    );
  });

  it("une convocation seulement signalée ne dit ni oui ni non", () => {
    expect(evenement(CONVOQUE)).toBeUndefined();
  });

  it("une permission pas encore qualifiée ne dit ni oui ni non", () => {
    expect(evenement(PATIENT_SEUL)).toBeUndefined();
  });
});

// ---- implémentation ----

const evenement = (reponses: Reponses) =>
  faits(reponses).fait_evenement_sans_soin.value;
