// Ce que le premier résultat du modèle de l'éditeur donne au journal des
// parcours (#386), sur la seed de chaque issue : ses codes, calculés par les
// règles, et la composition du transport (ANA22-04, #509). Voir ADR-0045.

import { describe, expect, it } from "vitest";
import { SEEDS } from "../../../../core/models/eligibilite/seeds-catalogue";
import { CODES_DU_RESULTAT } from "../../../../front/models/eligibilite/codes-du-resultat";
import { luDe, type Reponses } from "../p2/reponses-de-la-permission";

// Les réponses de la seed.
function reponsesDe(id: string): Reponses {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  return seed.answers as Reponses;
}

// Ce que le R2 de la seed donne au journal.
function journalDe(id: string) {
  return luDe(CODES_DU_RESULTAT, reponsesDe(id));
}

// La composition du transport de ces réponses, et son mode terrestre.
function compositionDe(reponses: Reponses) {
  const { transportComposition, mode } = luDe(CODES_DU_RESULTAT, reponses);
  return { transportComposition, mode };
}

// Le transport assis : le cas commun.
const COMMUN = {
  mode: "TAP",
  transportComposition: "terrestrial_only",
} as const;
const QUALIFIE = { ...COMMUN, reasonCodes: ["MOTIF_QUALIFIE"] } as const;
// Sans support, aucun mode ne s'applique (hypothèse, point 23 du retour
// v10.2.2).
const SANS_SUPPORT = {
  mode: null,
  transportComposition: "not_applicable",
  support: "AUCUN",
} as const;

describe("le journal du premier résultat, sur la seed de chaque issue", () => {
  it.each([
    ["issue-pmt", { issue: "ISSUE_PMT", ...QUALIFIE, support: "S3138g" }],
    [
      "issue-dap-sans-urgence",
      {
        issue: "ISSUE_DAP_SANS_URGENCE",
        ...QUALIFIE,
        support: "S3139h",
      },
    ],
    [
      "issue-dap-urgence-attestee",
      {
        issue: "ISSUE_DAP_URGENCE_ATTESTEE",
        ...QUALIFIE,
        support: "S3139h",
      },
    ],
    [
      "issue-s3141",
      {
        issue: "ISSUE_S3141",
        ...COMMUN,
        reasonCodes: ["PERMISSION_MINEUR"],
        support: "S3141",
      },
    ],
    [
      "issue-non-eligible",
      {
        issue: "ISSUE_NON_ELIGIBLE",
        ...SANS_SUPPORT,
        reasonCodes: ["AUCUN_MOTIF_TRANSPORT"],
      },
    ],
    [
      "issue-caisse",
      {
        issue: "ISSUE_CAISSE",
        ...SANS_SUPPORT,
        reasonCodes: ["CNAM_CENTRE15_INTERETABLISSEMENT"],
      },
    ],
    [
      "issue-etablissement",
      {
        issue: "ISSUE_ETABLISSEMENT",
        ...SANS_SUPPORT,
        reasonCodes: ["ARTICLE80_ETABLISSEMENT"],
      },
    ],
    [
      "issue-permission-patient",
      {
        issue: "ISSUE_PERMISSION_PATIENT",
        ...SANS_SUPPORT,
        reasonCodes: ["MOTIF_QUALIFIE"],
      },
    ],
    [
      "issue-convocation",
      {
        issue: "ISSUE_CONVOCATION",
        ...QUALIFIE,
        ...SANS_SUPPORT,
      },
    ],
    [
      "issue-dap-etranger-a-examiner",
      {
        issue: "ISSUE_DAP_ETRANGER_A_EXAMINER",
        mode: "TAP",
        transportComposition: "terrestrial_only",
        reasonCodes: ["TRANSPORT_ETRANGER_EXAMEN_CAISSE"],
        support: "S3139h",
      },
    ],
  ])("%s", (seed, attendu) => {
    expect(journalDe(seed)).toEqual(attendu);
  });
});

// ANA22-04 : la ligne régulière vient de Q2.3.2, sa partie terrestre de
// Q2.3.2.terrestre. `mode` ne dit que le mode terrestre.
describe("la composition du transport", () => {
  it("un trajet terrestre seul porte son mode", () => {
    expect(compositionDe(reponsesDe("issue-pmt"))).toEqual({
      transportComposition: "terrestrial_only",
      mode: "TAP",
    });
  });

  it("la ligne régulière seule n'a pas de mode terrestre", () => {
    expect(compositionDe(reponsesDe("issue-dap-avion-ou-bateau"))).toEqual({
      transportComposition: "regular_line_only",
      mode: null,
    });
  });

  it("la ligne régulière avec une partie terrestre est mixte, avec le mode de cette partie", () => {
    expect(compositionDe(reponsesDe("issue-dap-trajet-mixte"))).toEqual({
      transportComposition: "mixed",
      mode: "TAP",
    });
  });

  it("la ligne régulière sans réponse en Q2.3.2.terrestre reste inconnue, sans mode", () => {
    const { "Q2.3.2.terrestre": _, ...sansReponse } = reponsesDe(
      "issue-dap-avion-ou-bateau",
    );

    expect(compositionDe(sansReponse)).toEqual({
      transportComposition: "unknown",
      mode: null,
    });
  });

  it("un résultat sans support est sans objet, sans mode", () => {
    expect(compositionDe(reponsesDe("issue-caisse"))).toEqual({
      transportComposition: "not_applicable",
      mode: null,
    });
  });

  it("une réponse de Q2.3.2.terrestre ne change rien sans ligne régulière", () => {
    const reponses = {
      ...reponsesDe("issue-pmt"),
      "Q2.3.2.terrestre": "1_OUI",
    };

    expect(compositionDe(reponses as Reponses)).toEqual({
      transportComposition: "terrestrial_only",
      mode: "TAP",
    });
  });
});
