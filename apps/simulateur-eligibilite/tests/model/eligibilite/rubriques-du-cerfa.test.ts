// Les rubriques que les cerfa de R3 partagent (#158) : des réponses d'un
// parcours complet et les cibles figées au verrou, les cellules qu'elles
// donnent. Aucun PDF n'est en jeu : le test de chaque cerfa vérifie seulement
// où vont les cellules. `mapping_documents.json` et `CONTRAT_LIEUX_CERFA.json`.

import { describe, expect, it } from "vitest";
import { ACCIDENT } from "../../../front/models/eligibilite/r3/rubriques/accident";
import { EXONERATION } from "../../../front/models/eligibilite/r3/rubriques/exoneration";
import { LIENS } from "../../../front/models/eligibilite/r3/rubriques/liens";
import { MODE } from "../../../front/models/eligibilite/r3/rubriques/mode";
import { PRESCRIPTION } from "../../../front/models/eligibilite/r3/rubriques/prescription";
import type {
  Donnees,
  Rubrique,
} from "../../../front/models/eligibilite/r3/rubriques/rubrique";
import { TRAJET } from "../../../front/models/eligibilite/r3/rubriques/trajet";
import { MINEUR } from "./reponses-de-la-permission";
import {
  donnees,
  EHPAD,
  PERMISSIONS,
  PMT,
  type Reponses,
} from "./reponses-du-cerfa";
import type { ValeursDesCibles } from "./traces-du-praticien";

describe("l'accident causé par un tiers", () => {
  it("coche Oui et donne sa date", () => {
    const reponses: Reponses = {
      ...PMT,
      "Q3.6.2": "1_OUI",
      "Q3.6.3": "2026-09-30",
    };

    expect(cellules(ACCIDENT, reponses)).toEqual({
      tiers_oui: true,
      tiers_non: false,
      tiers_date: "2026-09-30",
    });
  });

  it("coche Non, sans date", () => {
    expect(cellules(ACCIDENT, PMT)).toEqual({
      tiers_oui: false,
      tiers_non: true,
      tiers_date: undefined,
    });
  });

  it("sans réponse, ne coche ni Oui ni Non", () => {
    const { "Q3.6.2": _, ...sansReponse } = PMT;

    expect(cellules(ACCIDENT, sansReponse)).toEqual({
      tiers_oui: false,
      tiers_non: false,
      tiers_date: undefined,
    });
  });
});

describe("le mode et ses critères", () => {
  it("cochent ce que les règles établissent", () => {
    const cibles = {
      cible_mode_tap_ou_tpmr: false,
      cible_mode_individual: true,
      cible_fauteuil_roulant: true,
    };

    expect(cellules(MODE, PMT, cibles)).toMatchObject({
      mode_tap_ou_tpmr: false,
      mode_individual: true,
      mode_public: false,
      fauteuil: true,
    });
  });

  it.each([
    ["réfuté", false],
    ["sans objet", null],
    ["inconnu", undefined],
  ] as const)(
    "ne cochent pas le transport partagé %s (COR-06)",
    (_cas, valeur) => {
      const cibles = { cible_transport_partage_incompatible: valeur };

      expect(cellules(MODE, PMT, cibles).partage_incompatible).toBe(false);
    },
  );
});

describe("les liens du transport", () => {
  it("cochent l'ALD exonérante et l'AT/MP, avec la date de Q3.6.1", () => {
    const cibles = {
      cible_ald_juridiquement_qualifiante_3_ou_4_degres: true,
      cible_situation_at_mp: true,
    };
    const reponses: Reponses = { ...PMT, "Q3.6.1": "2026-08-12" };

    expect(cellules(LIENS, reponses, cibles)).toEqual({
      lien_ald: true,
      lien_atmp: true,
      lien_atmp_date: "2026-08-12",
    });
  });

  it("sans lien établi, ne cochent rien", () => {
    const cibles = {
      cible_ald_juridiquement_qualifiante_3_ou_4_degres: false,
      cible_situation_at_mp: false,
    };

    expect(cellules(LIENS, PMT, cibles)).toEqual({
      lien_ald: false,
      lien_atmp: false,
      lien_atmp_date: undefined,
    });
  });
});

describe("l'exonération du ticket modérateur (D-136)", () => {
  it("un cas coché donne Oui", () => {
    const reponses: Reponses = { ...PMT, "Q3.7": ["1_ACTE_LOURD"] };

    expect(cellules(EXONERATION, reponses)).toEqual({
      exoneration_oui: true,
      exoneration_non: false,
    });
  });

  it("« Aucun autre cas » donne Non", () => {
    expect(cellules(EXONERATION, PMT)).toEqual({
      exoneration_oui: false,
      exoneration_non: true,
    });
  });

  it("sans Q3.7 posée, ne coche ni Oui ni Non, même avec une réponse restée", () => {
    const reponses: Reponses = { ...PERMISSIONS, "Q3.7": ["7_AUCUN"] };

    expect(cellules(EXONERATION, reponses)).toEqual({
      exoneration_oui: false,
      exoneration_non: false,
    });
  });
});

describe("la date de la prescription", () => {
  it("est le jour de Paris où P3 a été validée", () => {
    const completedAt = new Date("2026-10-22T22:30:00Z");

    expect(cellules(PRESCRIPTION, PMT, {}, completedAt)).toEqual({
      date_prescription: "2026-10-23",
    });
  });
});

describe("le trajet", () => {
  it("de plusieurs permissions : l'établissement en structure de soins, le domicile coché, l'aller-retour", () => {
    expect(cellules(TRAJET, PERMISSIONS)).toEqual({
      depart_domicile: false,
      depart_structure: "Hôpital Necker, 149 rue de Sèvres, 75015 Paris",
      depart_autre: undefined,
      arrivee_domicile: true,
      arrivee_structure: undefined,
      arrivee_autre: undefined,
      aller_retour: true,
    });
  });

  it("écrit un EHPAD dans l'autre lieu, sous sa mention", () => {
    const reponses: Reponses = {
      ...PMT,
      "Q3.2.nature": "3_EHPAD",
      "Q3.2.nom": "Les Tilleuls",
      "Q3.2.adresse": EHPAD,
    };

    expect(cellules(TRAJET, reponses)).toMatchObject({
      depart_domicile: false,
      depart_structure: undefined,
      depart_autre: "EHPAD, Les Tilleuls, 12 avenue Berthelot, 69007 Lyon",
    });
  });

  it("écrit la nature saisie d'un autre lieu", () => {
    const reponses: Reponses = {
      ...PMT,
      "Q3.2.nature": "8_AUTRE_LIEU",
      "Q3.2.precision": "Lieu de travail",
      "Q3.2.adresse": EHPAD,
    };

    expect(cellules(TRAJET, reponses).depart_autre).toBe(
      "Lieu de travail, 12 avenue Berthelot, 69007 Lyon",
    );
  });

  it("d'une PMT, coche le domicile et écrit le centre, sans aller-retour", () => {
    expect(cellules(TRAJET, PMT)).toMatchObject({
      depart_domicile: true,
      arrivee_structure: "Centre de dialyse, 149 rue de Sèvres, 75015 Paris",
      aller_retour: false,
    });
  });

  it("sans P3 répondue, ne coche ni n'écrit rien", () => {
    expect(cellules(TRAJET, MINEUR)).toEqual({
      depart_domicile: false,
      depart_structure: undefined,
      depart_autre: undefined,
      arrivee_domicile: false,
      arrivee_structure: undefined,
      arrivee_autre: undefined,
      aller_retour: false,
    });
  });
});

// ---- implémentation ----

// Chaque cellule de la rubrique, calculée sur ces données.
function cellules<Cellules>(
  rubrique: Rubrique<Cellules>,
  reponses: Reponses,
  cibles: ValeursDesCibles = {},
  completedAt?: Date,
): Cellules {
  const lues = donnees(reponses, cibles, completedAt);
  return Object.fromEntries(
    Object.entries(rubrique).map(([cellule, calcul]) => [
      cellule,
      (calcul as (donnees: Donnees) => unknown)(lues),
    ]),
  ) as Cellules;
}
