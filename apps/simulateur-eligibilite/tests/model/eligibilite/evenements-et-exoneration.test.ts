// Les pages des évènements et de l'exonération de P3 (Q3.6, Q3.7, #147),
// posées selon les cibles figées au verrou. `CATALOGUE_COMPLET_QUESTIONS.md`
// Q3.6 et Q3.7, `mapping_documents.json` (cases tiers, AT/MP, exonération).

import { describe, expect, it } from "vitest";
import { model } from "../../../core/models/eligibilite";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import { jourAParis } from "../../../core/models/eligibilite/p3/pages-des-evenements";
import { SEEDS } from "../../../core/models/eligibilite/seeds-catalogue";
import { preconisationOf } from "../../../core/socle/model";
import type { Answers } from "../../../core/socle/questionnaire-engine/question";
import { Questionnaire } from "../../../core/socle/questionnaire-engine/questionnaire";
import { BRANCARD_20_KM } from "./reponses-de-la-branche";

type Reponses = Answers<Questions>;

const pages = model.complement.pages;

const seed = (id: string) => {
  const trouvee = SEEDS.find((candidate) => candidate.id === id);
  if (!trouvee) throw new Error(`seed ${id} absente`);
  return trouvee.answers as Reponses;
};
const posees = (pageId: string, reponses: Reponses) => {
  const page = pages.find(({ id }) => id === pageId);
  if (!page) throw new Error(`${pageId} n'existe pas`);
  const { cibles } = preconisationOf(model, reponses);
  return new Questionnaire(pages).readWith(reponses, cibles).questionsOn(page);
};
const ids = (pageId: string, reponses: Reponses) =>
  posees(pageId, reponses).map(({ id }) => id);
const posee = (pageId: string, id: string, reponses: Reponses) => {
  const question = posees(pageId, reponses).find((q) => q.id === id);
  if (!question) throw new Error(`${id} n'est pas posée`);
  return question;
};
const cases = (reponses: Reponses) => {
  const question = posee("P3/exoneration", "Q3.7", reponses);
  return question.kind === "multiple choice"
    ? {
        proposees: question.options.map(({ value }) => value),
        exclusive: question.exclusiveOption?.value,
      }
    : undefined;
};

// Une DAP au-delà de 150 km, pour des soins liés à un accident du travail.
const ATMP = {
  ...BRANCARD_20_KM,
  "Q2.2.1": ["3_AUTRE_CADRE"],
  "Q2.2.1.b": ["1_ATMP"],
  "Q2.3.1": "3_PLUS_DE_CENT_CINQUANTE_KM",
  "Q2.3.3": "2_NON",
  "Q2.3.4": "2_NON",
} as Reponses;

describe("la page des évènements (Q3.6)", () => {
  it("sans AT/MP, ne demande que l'accident causé par un tiers", () => {
    expect(ids("P3/evenements", seed("issue-pmt"))).toEqual(["Q3.6.2"]);
  });

  it("avec un AT/MP établi en P2, demande sa date et rappelle la case cochée", () => {
    expect(ids("P3/evenements", ATMP)).toEqual(["Q3.6.1", "Q3.6.2"]);
    expect(posee("P3/evenements", "Q3.6.1", ATMP).reminder).toBe(
      "Le transport est lié à un accident du travail ou à une maladie professionnelle : la case est déjà cochée.",
    );
  });

  it("le S3141 a aussi la case de l'accident causé par un tiers", () => {
    expect(ids("P3/evenements", seed("issue-s3141"))).toEqual(["Q3.6.2"]);
  });

  it.each([
    ["Oui", "1_OUI", ["Q3.6.2", "Q3.6.3"]],
    ["Non", "2_NON", ["Q3.6.2"]],
  ] as const)("un accident causé par un tiers : %s", (_, tiers, attendues) => {
    const reponses: Reponses = { ...seed("issue-pmt"), "Q3.6.2": tiers };
    expect(ids("P3/evenements", reponses)).toEqual(attendues);
  });

  it.each([
    ["Q3.6.1", ATMP],
    ["Q3.6.3", { ...seed("issue-pmt"), "Q3.6.2": "1_OUI" } as Reponses],
  ])(
    "%s refuse une date dans le futur, et accepte une date passée",
    (id, base) => {
      const avec = (date: string) =>
        posee("P3/evenements", id, { ...base, [id]: date }).inconsistencies;
      expect(avec("2999-01-01")).toEqual([
        "Cette date est dans le futur : un accident ne peut pas encore avoir eu lieu.",
      ]);
      expect(avec("2020-01-01")).toEqual([]);
    },
  );
});

describe("le jour qui borne les dates (Q3.6)", () => {
  it("est celui de Paris, et non celui du fuseau du poste", () => {
    expect(jourAParis(new Date("2026-10-18T22:30:00Z"))).toBe("2026-10-19");
    expect(jourAParis(new Date("2026-12-31T22:59:00Z"))).toBe("2026-12-31");
  });
});

describe("la page de l'exonération (Q3.7)", () => {
  it("pour la PMT, propose les cinq cas, et « Aucun » exclusif", () => {
    expect(cases(seed("issue-pmt"))).toEqual({
      proposees: [
        "1_ACTE_LOURD",
        "2_TRANSFERT_CONSECUTIF",
        "3_URGENCE_HOSPITALIERE",
        "4_HAD_OU_RADIOTHERAPIE",
        "5_NOUVEAU_NE",
      ],
      exclusive: "7_AUCUN",
    });
  });

  it("pour la DAP, propose les seuls cas de sa notice, dont le traitement mieux adapté", () => {
    expect(cases(seed("issue-dap-sans-urgence"))).toEqual({
      proposees: [
        "1_ACTE_LOURD",
        "2_TRANSFERT_CONSECUTIF",
        "5_NOUVEAU_NE",
        "6_TRAITEMENT_MIEUX_ADAPTE",
      ],
      exclusive: "7_AUCUN",
    });
  });

  it("l'acte lourd cite le seuil des notices", () => {
    const question = posee("P3/exoneration", "Q3.7", seed("issue-pmt"));
    const options = question.kind === "multiple choice" ? question.options : [];
    expect(options[0]?.label).toBe(
      "Un acte réalisé lors de l’hospitalisation a un coefficient égal ou supérieur à K60, ou un tarif égal ou supérieur à 120 euros.",
    );
  });

  it("hors contexte hospitalier établi, ne se pose pas", () => {
    expect(ids("P3/exoneration", seed("issue-s3141"))).toEqual([]);
  });
});
