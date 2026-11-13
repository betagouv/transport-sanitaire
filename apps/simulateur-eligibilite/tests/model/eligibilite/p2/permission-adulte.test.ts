// La permission d'un adulte, autorisée pour les soins ou l'organisation de
// l'établissement (Q2.7 = 3, QST-PERMISSION-ADULTE-20261106, v10.1.8) : elle
// relève de l'article 80, et pose les exceptions encore inconnues (D-283,
// QST-PERMISSION-EXCEPTIONS-20261113).
// Une exception encore inconnue empêche de décider (correctif du 13 novembre).

import { describe, expect, it } from "vitest";
import {
  ciblesDe,
  issue,
  PATIENT_SEUL,
  posee,
  type Reponses,
} from "./reponses-de-la-permission";
import { faits, proposees } from "./reponses-du-transfert";

describe("la permission d'un adulte, autorisée", () => {
  it("relève de l'article 80 : ni l'admissibilité du mineur, ni la charge du patient", () => {
    expect([
      faits(ADULTE).fait_transfert_article80.value,
      faits(ADULTE).fait_permission_mineur_admissible.value,
      faits(ADULTE).fait_permission_charge_patient.value,
    ]).toEqual([true, false, false]);
  });

  // Comme le test de l'éditeur (`post_audit_20261110.mjs`, « permission adulte :
  // Q2.6 avec les seules exceptions non établies ») : sept options, ni la 2, que
  // le séjour écarte, ni le Centre 15, qui exige un transfert.
  it("pose les exceptions, sauf l'admission sans séjour et le Centre 15", () => {
    expect(proposees(ADULTE)).toEqual([
      "4_AIR_MER",
      "5_HAD",
      "6_USLD",
      "7_EHPAD",
      "8_RADIOTHERAPIE",
      "9_DIALYSE_A_DOMICILE",
      "10_ADMISSION_HAD",
    ]);
  });

  it("n'ouvre pas la page du mineur", () => {
    expect(posee("P2/permission-mineur", "Q2.8.1", ADULTE)).toBeUndefined();
  });

  it("laisse les exceptions inconnues tant que Q2.6 n'a pas de réponse", () => {
    expect(faits(ADULTE).fait_exception_article80_usld.value).toBeUndefined();
  });

  it("ne décide pas tant qu'une exception inconnue peut changer l'issue", () => {
    expect([
      ciblesDe(ADULTE).cible_exception_article80_inconnue_decisive.value,
      ciblesDe(ADULTE).cible_decision_calculable.value,
      issue(ADULTE),
    ]).toEqual([true, false, null]);
  });

  it("sans exception, le transport est à la charge de l'établissement", () => {
    expect(issue({ ...ADULTE, "Q2.6": ["11_AUCUNE"] })).toBe(
      "ISSUE_ETABLISSEMENT",
    );
  });

  it("une exception suffit : les autres valent « non »", () => {
    const ehpad: Reponses = { ...ADULTE, "Q2.6": ["7_EHPAD"] };
    expect(faits(ehpad).fait_exception_article80_ehpad.value).toBe(true);
    expect(faits(ehpad).fait_exception_article80_usld.value).toBe(false);
    expect(issue(ehpad)).not.toBe("ISSUE_ETABLISSEMENT");
  });
});

// ---- implémentation ----

const ADULTE: Reponses = { ...PATIENT_SEUL, "Q2.7": "3_ADULTE_AUTORISEE" };
