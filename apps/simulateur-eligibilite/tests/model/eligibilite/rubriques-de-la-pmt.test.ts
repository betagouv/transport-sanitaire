// Les rubriques que la PMT ajoute à celles du S3141 (#160), et que la DAP
// reprend : les motifs, le nombre de transports, l'urgence et le centre de
// référence. Des réponses d'un parcours complet et les cibles figées au verrou,
// les cellules qu'elles donnent. « Sources et cases » de
// `COMPLETION_DOCUMENTS.md` et `mapping_documents.json`, en v10.1.3.

import { describe, expect, it } from "vitest";
import { CENTRE_DE_REFERENCE } from "../../../front/models/eligibilite/r3/rubriques/centre-de-reference";
import { MOTIFS } from "../../../front/models/eligibilite/r3/rubriques/motifs";
import { NOMBRE } from "../../../front/models/eligibilite/r3/rubriques/nombre";
import {
  PRECISION_DE_L_URGENCE,
  URGENCE,
} from "../../../front/models/eligibilite/r3/rubriques/urgence";
import { MINEUR } from "./reponses-de-la-permission";
import { cellules, PMT, type Reponses } from "./reponses-du-cerfa";

describe("les motifs de la prise en charge", () => {
  it("cochent l'hospitalisation, l'ALD à 100 % et l'AT/MP établis, avec la date de Q3.6.1", () => {
    const cibles = {
      cible_hospitalisation_ou_seances_assimilees: true,
      cible_ald_juridiquement_qualifiante_3_ou_4_degres: true,
      cible_situation_at_mp: true,
    };
    const reponses: Reponses = { ...PMT, "Q3.6.1": "2026-08-12" };

    expect(cellules(MOTIFS, reponses, cibles)).toEqual({
      hospitalisation: true,
      ald_exo: true,
      ald_non_exo: false,
      atmp: true,
      atmp_date: "2026-08-12",
    });
  });

  it("cochent « ALD non exonérante » pour le mineur reconnu, sans ALD à 100 % (#128)", () => {
    const cibles = {
      cible_ald_juridiquement_qualifiante_3_ou_4_degres: false,
      cible_mineur_ald_non_exonerante_reconnue: true,
    };

    expect(cellules(MOTIFS, PMT, cibles)).toMatchObject({
      ald_exo: false,
      ald_non_exo: true,
    });
  });

  it("sans motif établi, ne cochent rien", () => {
    const cibles = {
      cible_hospitalisation_ou_seances_assimilees: false,
      cible_ald_juridiquement_qualifiante_3_ou_4_degres: false,
      cible_mineur_ald_non_exonerante_reconnue: false,
      cible_situation_at_mp: false,
    };

    expect(cellules(MOTIFS, PMT, cibles)).toEqual({
      hospitalisation: false,
      ald_exo: false,
      ald_non_exo: false,
      atmp: false,
      atmp_date: undefined,
    });
  });
});

describe("le nombre de transports", () => {
  it("est celui de ce document, Q3.1.1", () => {
    expect(cellules(NOMBRE, { ...PMT, "Q3.1.1": 2 })).toEqual({
      nombre: "2",
    });
  });

  it("sans P3 répondue, reste vide", () => {
    expect(cellules(NOMBRE, MINEUR)).toEqual({ nombre: undefined });
  });
});

describe("l'urgence", () => {
  const PRECISION: Reponses = { ...PMT, "Q3.5": "  Douleur\n thoracique  " };

  it("coche « autres » hors appel au Centre 15, avec la précision de Q3.5", () => {
    const cibles = { cible_urgence_appel15: false, cible_urgence_autre: true };

    expect(cellules(URGENCE, PRECISION, cibles)).toEqual({
      urgence_appel15: false,
      urgence_autre: true,
    });
    expect(cellules(PRECISION_DE_L_URGENCE, PRECISION, cibles)).toEqual({
      urgence_precision: "Douleur thoracique",
    });
  });

  it("coche l'appel au Centre 15 établi, sans précision", () => {
    const cibles = { cible_urgence_appel15: true, cible_urgence_autre: false };

    expect(cellules(URGENCE, PRECISION, cibles)).toEqual({
      urgence_appel15: true,
      urgence_autre: false,
    });
    expect(cellules(PRECISION_DE_L_URGENCE, PRECISION, cibles)).toEqual({
      urgence_precision: undefined,
    });
  });

  it("sans urgence, ne coche ni n'écrit rien", () => {
    expect(cellules(URGENCE, PMT)).toEqual({
      urgence_appel15: false,
      urgence_autre: false,
    });
    expect(cellules(PRECISION_DE_L_URGENCE, PMT)).toEqual({
      urgence_precision: undefined,
    });
  });
});

describe("le centre de référence des maladies rares", () => {
  it("se coche pour la destination réelle", () => {
    const cibles = { cible_centre_reference_destination_reelle: true };

    expect(cellules(CENTRE_DE_REFERENCE, PMT, cibles)).toEqual({
      centre_rare: true,
    });
  });

  it("reste vide sur Non (Q3.4.a)", () => {
    expect(cellules(CENTRE_DE_REFERENCE, PMT)).toEqual({ centre_rare: false });
  });
});
