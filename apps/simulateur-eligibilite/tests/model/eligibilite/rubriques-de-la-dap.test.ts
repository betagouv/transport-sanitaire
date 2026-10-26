// Les rubriques propres à la DAP (#161) : ses motifs d'accord préalable, et la
// situation d'un transport par avion ou bateau de ligne. Des réponses d'un
// parcours complet et les cibles figées au verrou, les cellules qu'elles
// donnent. « Sources et cases » de `COMPLETION_DOCUMENTS.md` et
// `mapping_documents.json`, en v10.1.3.

import { describe, expect, it } from "vitest";
import { AVION_OU_BATEAU } from "../../../front/models/eligibilite/r3/rubriques/avion-ou-bateau";
import { MOTIFS_DE_LA_DAP } from "../../../front/models/eligibilite/r3/rubriques/motifs-de-la-dap";
import { cellules, DAP, ETRANGER, type Reponses } from "./reponses-du-cerfa";

const SANS_MOTIF = {
  cible_dap_motif_longue_distance: false,
  cible_dap_motif_serie: false,
  cible_dap_motif_camsp_cmpp: false,
  cible_dap_motif_engagement_maternite: false,
  cible_dap_motif_avion_bateau: false,
};

describe("les motifs de la DAP", () => {
  it("cochent la longue distance du parcours", () => {
    expect(cellules(MOTIFS_DE_LA_DAP, DAP)).toEqual({
      longue_distance: true,
      serie: false,
      camsp_cmpp: false,
      engagement_maternite: false,
      avion_bateau: false,
    });
  });

  it("cochent ensemble tous les fondements établis", () => {
    const cibles = {
      cible_dap_motif_longue_distance: true,
      cible_dap_motif_serie: true,
      cible_dap_motif_camsp_cmpp: true,
      cible_dap_motif_engagement_maternite: true,
      cible_dap_motif_avion_bateau: true,
    };

    expect(Object.values(cellules(MOTIFS_DE_LA_DAP, DAP, cibles))).toEqual([
      true,
      true,
      true,
      true,
      true,
    ]);
  });

  it("ne cochent rien pour le transport à l'étranger à examiner", () => {
    expect(
      Object.values(cellules(MOTIFS_DE_LA_DAP, ETRANGER)).some(Boolean),
    ).toBe(false);
  });
});

describe("la situation d'un transport par avion ou bateau", () => {
  const AVION = {
    cible_dap_motif_avion_bateau: true,
    cible_personne_accompagnante: true,
    cible_hospitalisation_ou_seances_assimilees: true,
    cible_ald_juridiquement_qualifiante_3_ou_4_degres: true,
    cible_situation_at_mp: true,
  };
  const DATE_AT_MP: Reponses = { ...DAP, "Q3.6.1": "2026-08-12" };

  it("reprend l'accompagnant de P1 et les motifs établis, avec la date de Q3.6.1", () => {
    expect(cellules(AVION_OU_BATEAU, DATE_AT_MP, AVION)).toEqual({
      air_accompagnant: true,
      air_hospitalisation: true,
      air_ald_exo: true,
      air_ald_non_exo: false,
      air_atmp: true,
      air_atmp_date: "2026-08-12",
    });
  });

  it("sans avion ni bateau, ne coche rien", () => {
    const cibles = { ...AVION, cible_dap_motif_avion_bateau: false };

    expect(cellules(AVION_OU_BATEAU, DATE_AT_MP, cibles)).toEqual({
      air_accompagnant: false,
      air_hospitalisation: false,
      air_ald_exo: false,
      air_ald_non_exo: false,
      air_atmp: false,
      air_atmp_date: undefined,
    });
  });

  it("coche « ALD non exonérante » pour le mineur reconnu, même sans avion ni bateau (#128)", () => {
    const cibles = {
      ...SANS_MOTIF,
      cible_ald_juridiquement_qualifiante_3_ou_4_degres: false,
      cible_mineur_ald_non_exonerante_reconnue: true,
    };

    expect(cellules(AVION_OU_BATEAU, DAP, cibles)).toMatchObject({
      air_ald_exo: false,
      air_ald_non_exo: true,
    });
  });
});
