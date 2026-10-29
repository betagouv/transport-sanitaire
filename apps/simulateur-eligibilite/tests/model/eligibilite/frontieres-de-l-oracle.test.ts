// Les scénarios de test B01 à B21 de l'éditeur, rejoués contre nos règles. Ils
// viennent de sa recette v10.1.3 (`tests/release_test_vectors.json`). Chacun
// teste la frontière entre deux issues.
//
// Un scénario part de la base de l'oracle : tous les faits à « non », P1 et P2
// complètes. Il change quelques faits. Un fait que l'éditeur omet vaut ici
// `undefined` : il est inconnu.
//
// L'assertion porte sur trois cibles : l'issue, le support et le financeur.
// Comme l'éditeur, on lit chaque cible avec `?? null`. Une cible inconnue et
// une cible sans objet valent donc toutes deux `null`.

import { describe, expect, it } from "vitest";
import type { Cibles } from "../../../core/models/eligibilite/declarations/cibles";
import {
  ALD,
  ALD_NON_EXONERANTE,
  BRANCARD,
  type Changements,
  CONVOCATION,
  LONGUE_DISTANCE,
  MATERNITE,
  preconiser,
  TRANSFERT,
  URGENCE,
} from "./faits-de-l-oracle";

type Attendu = readonly [
  issue: Cibles["cible_issue_id"]["value"],
  support: Cibles["cible_support_id"]["value"],
  financeur: Cibles["cible_financeur"]["value"],
];

const PERMISSION_DU_MINEUR: Changements = {
  fait_permission: true,
  fait_permission_mineur_admissible: true,
};
const PMT: Attendu = ["ISSUE_PMT", "S3138g", "ASSURANCE_MALADIE"];
const DAP: Attendu = ["ISSUE_DAP_SANS_URGENCE", "S3139h", "ASSURANCE_MALADIE"];
const CAISSE: Attendu = ["ISSUE_CAISSE", "AUCUN", "NON_CONCLU"];
const NON_ELIGIBLE: Attendu = ["ISSUE_NON_ELIGIBLE", "AUCUN", "NON_CONCLU"];
const PERMISSION_PATIENT: Attendu = [
  "ISSUE_PERMISSION_PATIENT",
  "AUCUN",
  "PATIENT",
];

const SCENARIOS: readonly [id: string, faits: Changements, attendu: Attendu][] =
  [
    ["B01", BRANCARD, PMT],
    ["B02", LONGUE_DISTANCE, DAP],
    [
      "B03",
      { ...LONGUE_DISTANCE, ...URGENCE },
      ["ISSUE_DAP_URGENCE_ATTESTEE", "S3139h", "ASSURANCE_MALADIE"],
    ],
    [
      "B04",
      PERMISSION_DU_MINEUR,
      ["ISSUE_S3141", "S3141", "ASSURANCE_MALADIE"],
    ],
    ["B05", {}, NON_ELIGIBLE],
    ["B06", { ...ALD, fait_ald_exonerante_3_ou_4: undefined }, CAISSE],
    ["B07", TRANSFERT, ["ISSUE_ETABLISSEMENT", "AUCUN", "ETABLISSEMENT"]],
    [
      "B08",
      { fait_permission: true, fait_permission_charge_patient: true },
      PERMISSION_PATIENT,
    ],
    ["B09", CONVOCATION, ["ISSUE_CONVOCATION", "AUCUN", "ASSURANCE_MALADIE"]],
    [
      "B10",
      { ...BRANCARD, fait_trajet_etranger: true },
      ["ISSUE_DAP_ETRANGER_A_EXAMINER", "S3139h", "NON_CONCLU"],
    ],
    ["B11", { ...PERMISSION_DU_MINEUR, ...LONGUE_DISTANCE }, DAP],
    [
      "B12",
      { ...PERMISSION_DU_MINEUR, fait_permission_charge_patient: true },
      PERMISSION_PATIENT,
    ],
    ["B13", { ...TRANSFERT, fait_exception_article80_usld: true }, PMT],
    ["B14", { ...MATERNITE, ...URGENCE }, CAISSE],
    [
      "B15",
      {
        ...BRANCARD,
        fait_ald_liee: true,
        fait_ald_exonerante_3_ou_4: undefined,
      },
      PMT,
    ],
    [
      "B16",
      { ...BRANCARD, fait_exclusion_transport_prouvee: true },
      NON_ELIGIBLE,
    ],
    ["B17", { fait_convocation: undefined }, CAISSE],
    ["B18", { ...TRANSFERT, fait_centre15_interetablissements: true }, CAISSE],
    ["B19", ALD_NON_EXONERANTE, NON_ELIGIBLE],
    [
      "B20",
      { ...ALD, fait_distance_plus_50: true, fait_serie_qualifiante: true },
      PMT,
    ],
    ["B21", { fait_p2_complete: false }, [null, null, null]],
  ];

describe("les frontières entre issues de l'éditeur", () => {
  it.each(SCENARIOS)("%s", (_id, faits, [issue, support, financeur]) => {
    const valeurs = preconiser(faits);
    expect([
      valeurs.cible_issue_id ?? null,
      valeurs.cible_support_id ?? null,
      valeurs.cible_financeur ?? null,
    ]).toEqual([issue, support, financeur]);
  });
});
