// La consigne transitoire du mineur en ALD non exonérante (#128), sur la PMT
// et la DAP remplies. Le mineur reconnu en soins prolongés coche « ALD non
// exonérante » sur chaque volet, et sa mention s'écrit une fois, sur le seul
// volet médical (`COMPLETION_DOCUMENTS.md`, `mapping_documents.json`).
//
// Quand la cible vaut oui se teste contre les règles (`mineur.test.ts`,
// `ald-et-mineur.test.ts`) : jamais avec une ALD à 100 % établie, ni sans le
// cas 8 de Q1.3. La place de la mention dans le texte se teste avec sa
// rubrique (`texte-medical.test.ts`).

import { describe, expect, it } from "vitest";
import type { Donnees } from "../../../front/models/eligibilite/r3/rubriques/rubrique";
import { S3138G } from "../../../front/models/eligibilite/r3/s3138g/s3138g";
import { S3139H } from "../../../front/models/eligibilite/r3/s3139h/s3139h";
import { generateCerfa } from "../../../front/socle/cerfa/generate-cerfa";
import { type BoundCerfa, dtoFrom } from "../../../front/socle/cerfa-mapping";
import { markedStates, textsOn } from "../../socle/cerfa/test-form";
import { DAP, donnees, gabarit, PMT, type Reponses } from "./reponses-du-cerfa";
import type { ValeursDesCibles } from "./traces-du-praticien";

const MENTION =
  "Mineur nécessitant des soins prolongés en raison d’un handicap, d’une incapacité ou d’un accident";

const MINEUR = { cible_mineur_ald_non_exonerante_reconnue: true };
const ALD_A_100 = {
  cible_ald_juridiquement_qualifiante_3_ou_4_degres: true,
  cible_mineur_ald_non_exonerante_reconnue: false,
};
const SANS_AVION = { cible_dap_motif_avion_bateau: false };
const SERIE = {
  ...SANS_AVION,
  cible_dap_motif_serie: true,
  cible_dap_motif_longue_distance: false,
};

// Un support : son parcours, sa case « ALD non exonérante » et l'état qui la
// coche, ses volets et son volet médical.
type Support = {
  readonly nom: string;
  readonly cerfa: BoundCerfa<Donnees>;
  readonly reponses: Reponses;
  readonly cibles: ValeursDesCibles;
  readonly case: string;
  readonly etat: string;
  readonly volets: readonly number[];
  readonly medical: number;
};

const LA_PMT: Support = {
  ...{ nom: "S3138g", cerfa: S3138G, reponses: PMT, cibles: {} },
  ...{ case: "ALD exo", etat: "NON", volets: [3, 4], medical: 3 },
};
// La DAP d'une série, sans avion ni bateau.
const LA_DAP: Support = {
  ...{ nom: "S3139h", cerfa: S3139H, reponses: DAP, cibles: SERIE },
  ...{ case: "sit", etat: "ald", volets: [2, 3, 4], medical: 2 },
};
const SUPPORTS = [LA_PMT, LA_DAP];

const VOLETS = SUPPORTS.flatMap((support) =>
  support.volets.map((page) => [support.nom, page, support] as const),
);

describe("le mineur reconnu en soins prolongés (#128)", () => {
  it.each(VOLETS)(
    "%s : coche « ALD non exonérante » sur la page %i",
    async (_nom, page, support) => {
      const { pdf } = await rempli(support, MINEUR);

      expect(await marquees(support, pdf, support.case, page)).toEqual([
        support.etat,
      ]);
    },
  );

  it.each(SUPPORTS)(
    "$nom : écrit la mention une fois, sur le seul volet médical",
    async (support) => {
      const { pdf } = await rempli(support, MINEUR);

      for (const page of support.volets)
        expect(await mentions(pdf, page)).toBe(
          page === support.medical ? 1 : 0,
        );
    },
  );

  it.each(SUPPORTS)(
    "$nom : garde la mention quand la précision est retirée faute de place",
    async (support) => {
      const longue = "Suivi pluridisciplinaire au long cours ".repeat(20);
      const reponses = { ...support.reponses, "Q3.4": longue };
      const genere = await rempli({ ...support, reponses }, MINEUR);

      expect(genere.removedComments).toEqual(["elements_medicaux_precision"]);
      expect(await mentions(genere.pdf, support.medical)).toBe(1);
    },
  );
});

describe("la DAP du mineur reconnu (#128)", () => {
  it.each([
    ["en série", SERIE, ["non"]],
    ["à plus de 150 km", SANS_AVION, ["Oui"]],
  ] as const)("%s, garde son motif : %j", async (_cas, cibles, etats) => {
    const { pdf } = await rempli({ ...LA_DAP, cibles }, MINEUR);

    expect(await marquees(LA_DAP, pdf, "km")).toEqual(etats);
  });

  it("ne coche ni avion ni bateau, ni la personne accompagnante", async () => {
    const { pdf } = await rempli(LA_DAP, MINEUR);

    expect(await marquees(LA_DAP, pdf, "bat ou av")).toEqual([]);
    expect(await marquees(LA_DAP, pdf, "pers acc")).toEqual([]);
    expect(await marquees(LA_DAP, pdf, "sit")).toEqual(["ald"]);
  });
});

// Le parcours de la seed ne coche pas le cas 8 de Q1.3 : les règles ne
// reconnaissent aucun mineur.
describe("hors du mineur reconnu (#128)", () => {
  it.each([
    ["S3138g", "sans le cas 8 de Q1.3", LA_PMT, {}, []],
    ["S3139h", "sans le cas 8 de Q1.3", LA_DAP, {}, []],
    ["S3138g", "avec une ALD à 100 %", LA_PMT, ALD_A_100, ["OUI"]],
    ["S3139h", "avec une ALD à 100 %", LA_DAP, ALD_A_100, []],
  ] as const)(
    "%s, %s : ni sa case ni sa mention",
    async (_nom, _cas, support, cibles, etats) => {
      const { pdf } = await rempli(support, cibles);

      expect(await marquees(support, pdf, support.case)).toEqual(etats);
      expect(await mentions(pdf, support.medical)).toBe(0);
    },
  );
});

// ---- implémentation ----

// Le support rempli pour son parcours, et les commentaires qu'il a retirés.
async function rempli(
  { nom, cerfa, reponses, cibles }: Support,
  choisies: ValeursDesCibles,
): Promise<{ pdf: Uint8Array; removedComments: readonly string[] }> {
  const dto = dtoFrom(
    cerfa.mapping,
    donnees(reponses, { ...cibles, ...choisies }),
  );
  const depuisLeDisque = { ...cerfa.cerfa, template: () => gabarit(nom) };
  const genere = await generateCerfa(depuisLeDisque, dto);
  const pdf = new Uint8Array(await genere.pdf.arrayBuffer());
  return { pdf, removedComments: genere.removedComments };
}

// Les états marqués de la case `champ`, sur la page `page` ou sur toutes.
async function marquees(
  support: Support,
  pdf: Uint8Array,
  champ: string,
  page?: number,
): Promise<string[]> {
  return markedStates(await gabarit(support.nom), pdf, champ, page);
}

// Combien de fois la mention s'écrit sur la page. `pdf-lib` l'écrit en
// WinAnsi, où l'apostrophe typographique est l'octet 0x92.
async function mentions(pdf: Uint8Array, page: number): Promise<number> {
  const ecrit = (await textsOn(pdf, page)).join(" ").replaceAll("\x92", "’");
  return ecrit.split(MENTION).length - 1;
}
