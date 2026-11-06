// Les situations particulières du trajet, en deux blocs (Q2.2.1, puis
// Q2.2.1.b), et leurs précisions : `CONTRAT_Q221_PROGRESSIF.json`,
// `CONTRAT_CONTEXTES_DECISIFS.md` et `CONTRAT_NEGATIONS_PROUVEES.json` du
// paquet de l'éditeur (D-252).
//
// Une situation proposée et écartée vaut « non ». Une situation qui ne se
// propose pas garde son fait absent, et la réponse négative d'un bloc ne
// répond pas à l'autre.

import { describe, expect, it } from "vitest";
import type { Questions } from "../../../../core/models/eligibilite/questions/reponses";
import {
  AUCUNE,
  BRANCARD,
  DU_SEJOUR,
  faits,
  posee,
  proposees,
  type Reponses,
  valeurs,
} from "./reponses-des-contextes";

// Les faits que disent les deux blocs : la maternité et l'HTNM pour le
// premier, les autres pour le second.
const DES_SITUATIONS = [
  "fait_atmp_lie",
  "fait_dap_maternite",
  "fait_htnm_hors_maternite",
  "fait_motif_camsp",
  "fait_motif_samsah",
  "fait_motif_pension",
  "fait_convocation",
] as const;

describe("les deux blocs", () => {
  // L'examen et l'hébergement de la maternité sont deux cases
  // (QST-MAT-SEPARATION, D-272).
  it("proposent six et cinq situations, dans l'ordre du contrat", () => {
    expect(proposees("Q2.2.1", BRANCARD)).toEqual([
      "1_HOSPITALISATION",
      "2_ETRANGER",
      "14_EXAMEN_MATERNITE",
      "15_HEBERGEMENT_MATERNITE",
      "5_HTNM",
      "10_RETOUR_PENITENTIAIRE",
    ]);
    expect(proposees("Q2.2.1.b", AUCUNE)).toEqual([
      "1_ATMP",
      "6_CAMSP",
      "7_SAMSAH",
      "9_PENSION_MILITAIRE",
      "13_CONVOCATION",
    ]);
  });

  it("ont chacun leur réponse négative exclusive", () => {
    expect(posee("Q2.2.1", BRANCARD)?.exclusiveOption?.label).toBe(
      "Non, aucune de ces situations",
    );
    expect(posee("Q2.2.1.b", AUCUNE)?.exclusiveOption?.label).toBe(
      "Non, aucun.",
    );
  });

  it("refusent ensemble la maternité et l'HTNM, le CAMSP et le SAMSAH", () => {
    const incompatibles = (id: "Q2.2.1" | "Q2.2.1.b") =>
      posee(id, AUCUNE)?.incompatibleOptions?.map(({ values }) => values);
    expect(incompatibles("Q2.2.1")).toEqual([
      ["14_EXAMEN_MATERNITE", "5_HTNM"],
      ["15_HEBERGEMENT_MATERNITE", "5_HTNM"],
    ]);
    expect(incompatibles("Q2.2.1.b")).toEqual([["6_CAMSP", "7_SAMSAH"]]);
  });
});

describe("les réponses négatives", () => {
  const deuxNon = { ...AUCUNE, "Q2.2.1.b": ["0_AUCUN"] } satisfies Reponses;

  it("ensemble, écartent chaque situation proposée", () => {
    expect(
      valeurs(deuxNon, [
        ...DU_SEJOUR,
        ...DES_SITUATIONS,
        "fait_trajet_etranger",
      ]),
    ).toEqual(Array(13).fill(false));
  });

  it("n'établissent pas l'hospitalisation, que Q2.2.1 ne demande pas", () => {
    expect(faits(deuxNon).fait_hospitalisation.value).toBeUndefined();
  });

  it("« Non » au premier bloc ne répond pas au second", () => {
    expect(valeurs(AUCUNE, DES_SITUATIONS)).toEqual([
      undefined,
      false,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("« Non » au second bloc laisse la maternité du premier à qualifier", () => {
    const second = {
      ...BRANCARD,
      "Q2.2.1": ["15_HEBERGEMENT_MATERNITE"],
      "Q2.2.1.b": ["0_AUCUN"],
    } satisfies Reponses;
    expect(valeurs(second, DES_SITUATIONS)).toEqual([
      false,
      undefined,
      false,
      false,
      false,
      false,
      false,
    ]);
  });

  it("un formulaire vide n'est pas « Aucune »", () => {
    expect(
      valeurs({ ...BRANCARD, "Q2.2.1": [], "Q2.2.1.b": [] }, DES_SITUATIONS),
    ).toEqual(Array(7).fill(undefined));
  });
});

describe("une situation cochée", () => {
  const cochees = (
    premier: Questions["Q2.2.1"],
    second: Questions["Q2.2.1.b"],
  ): Reponses => ({ ...BRANCARD, "Q2.2.1": premier, "Q2.2.1.b": second });

  it("met à « oui » la situation cochée, à « non » celles écartées", () => {
    expect(valeurs(cochees(["0_AUCUNE"], ["1_ATMP"]), DES_SITUATIONS)).toEqual([
      true,
      ...Array(6).fill(false),
    ]);
  });

  it.each([
    [["0_AUCUNE"], ["6_CAMSP"], "fait_motif_camsp"],
    [["0_AUCUNE"], ["7_SAMSAH"], "fait_motif_samsah"],
    [["0_AUCUNE"], ["9_PENSION_MILITAIRE"], "fait_motif_pension"],
    // Son libellé le dit hors Engagement maternité (point 11, v10.1.3).
    [["5_HTNM"], ["0_AUCUN"], "fait_htnm_hors_maternite"],
  ] as const)("%j, %j donnent %s", (premier, second, fait) => {
    expect(faits(cochees(premier, second))[fait].value).toBe(true);
  });

  it("5_HTNM laisse son segment non vérifié : la caisse tranche", () => {
    expect(
      faits(cochees(["5_HTNM"], ["0_AUCUN"])).fait_htnm_segment_verifie.value,
    ).toBe(false);
  });

  it.each([
    [["14_EXAMEN_MATERNITE"], ["0_AUCUN"], "fait_dap_maternite"],
    [["15_HEBERGEMENT_MATERNITE"], ["0_AUCUN"], "fait_dap_maternite"],
    [["0_AUCUNE"], ["13_CONVOCATION"], "fait_convocation"],
  ] as const)(
    "%j, %j laissent %s à qualifier dans sa branche",
    (premier, second, fait) => {
      expect(faits(cochees(premier, second))[fait]).toEqual({
        provenance: expect.stringMatching(/À qualifier dans sa branche/),
      });
    },
  );
});

describe("le séjour en cours (Q2.2.1.a)", () => {
  const sejour = (permission: Questions["Q2.2.1.a"]): Reponses => ({
    ...BRANCARD,
    "Q2.2.1": ["1_HOSPITALISATION"],
    "Q2.2.1.cadre": "1_ETABLISSEMENT",
    "Q2.2.1.a": permission,
  });

  it("« Oui » établit la permission et écarte le transfert", () => {
    expect(valeurs(sejour("1_OUI"), DU_SEJOUR)).toEqual([
      false,
      false,
      true,
      undefined,
      undefined,
    ]);
  });

  it("« Non » écarte la permission, sa charge et la règle du mineur", () => {
    expect(valeurs(sejour("2_NON"), DU_SEJOUR)).toEqual([
      undefined,
      undefined,
      false,
      false,
      false,
    ]);
  });
});

describe("l'étranger (Q2.2.5)", () => {
  const etranger = (lieux: Questions["Q2.2.5"]): Reponses => ({
    ...BRANCARD,
    "Q2.2.1": ["2_ETRANGER"],
    "Q2.2.5": lieux,
  });

  it.each([
    [["1_DEPART"], true],
    [["2_ARRIVEE", "3_LIEU_DES_SOINS"], true],
    [["3_LIEU_DES_SOINS"], false],
  ] as const)("%j : fait_trajet_etranger vaut %s", (lieux, attendu) => {
    expect(faits(etranger(lieux)).fait_trajet_etranger.value).toBe(attendu);
  });
});
