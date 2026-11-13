// Ce que le premier résultat du modèle de l'éditeur donne au journal des
// parcours (#386), sur la seed de chaque issue : ses codes, calculés par les
// règles, les motifs du catalogue que la page affiche, et les portions du
// trajet qu'elle restitue. Voir docs/knowledge/adr/analytics.md, ADR-9.

import { describe, expect, it } from "vitest";
import { SEEDS } from "../../../../core/models/eligibilite/seeds-catalogue";
import { CODES_DU_RESULTAT } from "../../../../front/models/eligibilite/codes-du-resultat";
import { catalogueResultats } from "../../../../front/models/eligibilite/r2/components/textes-de-l-editeur";
import { R2 } from "../../../../front/models/eligibilite/r2/r2";
import {
  lectureDe,
  luDe,
  type Reponses,
} from "../p2/reponses-de-la-permission";

await catalogueResultats();

// Ce que le R2 de la seed donne au journal.
async function journalDe(id: string) {
  const seed = SEEDS.find((candidate) => candidate.id === id);
  if (!seed) throw new Error(`Seed inconnue : ${id}`);
  const reponses = seed.answers as Reponses;
  const page = await R2.of(lectureDe(reponses)).page();
  return {
    ...luDe(CODES_DU_RESULTAT, reponses),
    motifs: page.motifs,
    portions: page.portions,
  };
}

// Le transport assis, et l'Assurance Maladie qui paie : le cas commun.
const COMMUN = { mode: "TAP", financeur: "ASSURANCE_MALADIE" } as const;
const QUALIFIE = { ...COMMUN, reasonCodes: ["MOTIF_QUALIFIE"] } as const;
const SANS_SUPPORT = { mode: "TAP", support: "AUCUN" } as const;

describe("le journal du premier résultat, sur la seed de chaque issue", () => {
  it.each([
    [
      "issue-pmt",
      { issue: "ISSUE_PMT", ...QUALIFIE, support: "S3138g", motifs: ["E-H"] },
    ],
    [
      "issue-dap-sans-urgence",
      {
        issue: "ISSUE_DAP_SANS_URGENCE",
        ...QUALIFIE,
        support: "S3139h",
        motifs: ["EC-H", "ED-L"],
      },
    ],
    [
      "issue-dap-urgence-attestee",
      {
        issue: "ISSUE_DAP_URGENCE_ATTESTEE",
        ...QUALIFIE,
        support: "S3139h",
        motifs: ["EC-H", "EU-L"],
      },
    ],
    [
      "issue-s3141",
      {
        issue: "ISSUE_S3141",
        ...COMMUN,
        reasonCodes: ["PERMISSION_MINEUR"],
        support: "S3141",
        motifs: ["E-S3141-U"],
      },
    ],
    [
      "issue-non-eligible",
      {
        issue: "ISSUE_NON_ELIGIBLE",
        ...SANS_SUPPORT,
        reasonCodes: ["AUCUN_MOTIF_TRANSPORT"],
        financeur: "NON_CONCLU",
        motifs: ["AUCUN_CONSULTATION"],
      },
    ],
    [
      "issue-caisse",
      {
        issue: "ISSUE_CAISSE",
        ...SANS_SUPPORT,
        reasonCodes: ["CNAM_CENTRE15_INTERETABLISSEMENT"],
        financeur: "NON_CONCLU",
        motifs: ["centre15"],
      },
    ],
    [
      "issue-etablissement",
      {
        issue: "ISSUE_ETABLISSEMENT",
        ...SANS_SUPPORT,
        reasonCodes: ["ARTICLE80_ETABLISSEMENT"],
        financeur: "ETABLISSEMENT",
        motifs: ["transfert-provisoire"],
      },
    ],
    [
      "issue-permission-patient",
      {
        issue: "ISSUE_PERMISSION_PATIENT",
        ...SANS_SUPPORT,
        reasonCodes: ["MOTIF_QUALIFIE"],
        financeur: "PATIENT",
        motifs: ["demande-adulte"],
      },
    ],
    [
      "issue-convocation",
      {
        issue: "ISSUE_CONVOCATION",
        ...QUALIFIE,
        support: "AUCUN",
        motifs: ["controle"],
      },
    ],
    // Le catalogue cache le pourquoi de l'étranger : aucun motif n'est
    // affiché, la liste part vide.
    [
      "issue-dap-etranger-a-examiner",
      {
        issue: "ISSUE_DAP_ETRANGER_A_EXAMINER",
        mode: "TAP",
        reasonCodes: ["TRANSPORT_ETRANGER_EXAMEN_CAISSE"],
        support: "S3139h",
        financeur: "NON_CONCLU",
        motifs: [],
      },
    ],
  ])("%s", async (seed, attendu) => {
    expect(await journalDe(seed)).toEqual({ ...attendu, portions: [] });
  });

  it("un trajet en ligne régulière restitue sa portion, sans portion terrestre en transport assis", async () => {
    expect(await journalDe("issue-dap-avion-ou-bateau")).toMatchObject({
      motifs: ["EC-H", "ED-V"],
      portions: ["LIGNE_REGULIERE"],
    });
  });
});
