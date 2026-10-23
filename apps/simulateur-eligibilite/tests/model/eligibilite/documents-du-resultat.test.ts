// Les documents de R3 (#157) : le gabarit de chaque support, son titre et le
// texte de R3, recopiés de `CONTRAT_RENDU_DOCUMENTAIRE.json` (v10.1.3). La DAP
// se télécharge encore vierge, aplatie, sans champ. Le S3141 et la PMT se
// remplissent : `s3141-rempli.test.ts`, `s3138g-rempli.test.ts`.

import { describe, expect, it } from "vitest";
import type { Cibles } from "../../../core/models/eligibilite/declarations/cibles";
import { documentDuComplement } from "../../../front/models/eligibilite/r3/documents-du-resultat";
import { titreDuResultat } from "../../../front/models/eligibilite/r3/titre-du-resultat";
import { drawnOn } from "../../socle/cerfa/test-form";
import { genere } from "./reponses-du-cerfa";
import { ciblesValant } from "./traces-du-praticien";

type Support = NonNullable<Cibles["cible_support_id"]["value"]>;

const PRESCRIPTION = "Prescription préremplie prête à imprimer";
const ACCORD_PREALABLE =
  "Demande d’accord préalable préremplie prête à imprimer";

describe("le document de R3", () => {
  it.each([
    ["S3138g", "prescription-medicale-de-transport"],
    ["S3139h", "demande-d-accord-prealable"],
    ["S3141", "prescription-de-permission-de-sortie"],
  ] as const)("du support %s se nomme %s", (support, nom) => {
    const document = documentDuComplement(
      ciblesValant({ cible_support_id: support }),
    );

    expect(document?.cerfa.fileName).toBe(nom);
  });

  it.each([
    ["AUCUN", "AUCUN"],
    ["sans support", undefined],
    ["sans objet", null],
  ] as const)("%s, il n'y en a pas", (_cas, support) => {
    expect(
      documentDuComplement(ciblesValant({ cible_support_id: support })),
    ).toBeNull();
  });

  it("S3139h se génère vierge et aplati", async () => {
    const pdf = await vierge("S3139h");

    expect((await drawnOn(pdf)).fields).toBe(0);
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
    expect(titreDuResultat(ciblesValant({ cible_issue_id: issue }))).toBe(
      titre,
    );
  });
});

// ---- implémentation ----

// Le document vierge du support.
async function vierge(support: Support): Promise<Uint8Array> {
  const document = documentDuComplement(
    ciblesValant({ cible_support_id: support }),
  );
  if (!document) throw new Error(`Aucun document pour ${support}.`);
  return genere(document.cerfa, support, { fields: {}, drawings: {} });
}
