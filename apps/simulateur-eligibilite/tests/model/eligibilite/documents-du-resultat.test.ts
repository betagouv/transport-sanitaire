// Les documents de R3 (#157) : le gabarit de chaque support, son titre et le
// texte de R3, recopiés de `CONTRAT_RENDU_DOCUMENTAIRE.json` (v10.1.3). Les
// trois se remplissent : `s3141-rempli.test.ts`, `s3138g-rempli.test.ts`,
// `s3139h-rempli.test.ts`.

import { describe, expect, it } from "vitest";
import { DOCUMENT_DU_COMPLEMENT } from "../../../front/models/eligibilite/r3/documents-du-resultat";
import { TITRE_DU_RESULTAT } from "../../../front/models/eligibilite/r3/titre-du-resultat";
import { lu } from "./traces-du-prescripteur";

const PRESCRIPTION = "Prescription préremplie prête à imprimer";
const ACCORD_PREALABLE =
  "Demande d’accord préalable préremplie prête à imprimer";

describe("le document de R3", () => {
  it.each([
    ["S3138g", "prescription-medicale-de-transport"],
    ["S3139h", "demande-d-accord-prealable"],
    ["S3141", "prescription-de-permission-de-sortie"],
  ] as const)("du support %s se nomme %s", (support, nom) => {
    const document = lu(DOCUMENT_DU_COMPLEMENT, { cible_support_id: support });

    expect(document?.cerfa.fileName).toBe(nom);
  });

  it.each([
    ["AUCUN", "AUCUN"],
    ["sans support", undefined],
    ["sans objet", null],
  ] as const)("%s, il n'y en a pas", (_cas, support) => {
    expect(
      lu(DOCUMENT_DU_COMPLEMENT, { cible_support_id: support }),
    ).toBeNull();
  });
});

describe("le titre de R3", () => {
  it.each([
    ["ISSUE_PMT", PRESCRIPTION],
    ["ISSUE_S3141", PRESCRIPTION],
    ["ISSUE_DAP_SANS_URGENCE", ACCORD_PREALABLE],
    ["ISSUE_DAP_URGENCE_ATTESTEE", ACCORD_PREALABLE],
    [
      "ISSUE_DAP_ETRANGER_A_EXAMINER",
      "Demande d’examen préremplie prête à imprimer",
    ],
  ] as const)("de %s est « %s »", (issue, titre) => {
    expect(lu(TITRE_DU_RESULTAT, { cible_issue_id: issue })).toBe(titre);
  });
});
