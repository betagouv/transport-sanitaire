// Le retour vers un établissement pénitentiaire (option 10 de Q2.2.1.b) :
// TS1012-04 et `CONTRAT_CONTEXTES_V1012.json` du paquet v10.1.2 de l'éditeur,
// les points 33 et 34 de la v10.1.3 et `CONTRAT_ORIENTATION_ADMINISTRATIVE.json`.
// Ce qui établit l'indication médicale est notre lecture (D-130).

import { describe, expect, it } from "vitest";
import { model } from "../../../front/models/eligibilite";
import type { Cibles } from "../../../front/models/eligibilite/declarations/cibles";
import { TRANSFERT_VERS_LA_PRISON } from "../../../front/models/eligibilite/p2/retour-penitentiaire";
import { ciblesDe, lectureDe } from "./reponses-de-la-permission";
import {
  faits,
  posee,
  type Reponses,
  TRAJET,
  valeurs,
} from "./reponses-du-transfert";

const AVEC_UN_PROFESSIONNEL: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "3_AVEC_UN_PROFESSIONNEL",
  "Q1.2": ["1_PAS_AUTONOME"],
  "Q1.3": ["7_AUCUNE"],
};
const RETOUR: Reponses = {
  "Q2.2.1": ["3_AUTRE_CADRE"],
  "Q2.2.1.b": ["10_RETOUR_PENITENTIAIRE"],
};
const SORTIE: Reponses = {
  ...AVEC_UN_PROFESSIONNEL,
  "Q2.1": "8_HOSPITALISATION",
  "Q2.1.g": "2_SORTIE",
  ...RETOUR,
};
const DE_LA_SORTIE = [
  "fait_hospitalisation",
  "fait_transfert_article80",
  "fait_centre15_interetablissements",
  "fait_permission",
] as const;

const incoherences = (page: string, id: keyof Reponses, reponses: Reponses) =>
  posee(page, id, reponses)?.inconsistencies ?? [];

const SEUL: Reponses = {
  "Q0.1": "1_VERIFIER",
  "Q1.1": "1_SEUL",
  "Q1.3": ["7_AUCUNE"],
  "Q1.4": "1_VEHICULE_PERSONNEL",
  "Q2.1": "1_CONSULTATION",
  ...RETOUR,
};
const qualifie = (indication: Reponses["Q2.2.1.indication"]): Reponses => ({
  ...SEUL,
  "Q2.2.1.indication": indication,
  ...TRAJET,
});

describe("l'indication médicale d'un retour vers la prison (point 33)", () => {
  it.each([
    ["seul", SEUL],
    ["sans soin", { ...SEUL, "Q2.1": "15_AUCUN" }],
  ] as const)("%s, sans critère en P1, se demande", (_, reponses) => {
    expect(posee("P2/contextes", "Q2.2.1.indication", reponses)).toBeDefined();
  });

  it.each([
    ["un critère de Q1.2", { ...AVEC_UN_PROFESSIONNEL, "Q2.1": "15_AUCUN" }],
    ["une ALD en Q1.3", { ...SEUL, "Q1.3": ["2_ALD"] }],
  ] as const)("%s l'établit déjà", (_, avant) => {
    expect(
      posee("P2/contextes", "Q2.2.1.indication", { ...avant, ...RETOUR }),
    ).toBeUndefined();
  });

  it("ne se demande pas sans retour vers la prison", () => {
    expect(
      posee("P2/contextes", "Q2.2.1.indication", {
        ...SEUL,
        "Q2.2.1": ["4_AUCUNE"],
      }),
    ).toBeUndefined();
  });

  it("« Oui » laisse les règles calculer l'issue", () => {
    expect(ciblesDe(qualifie("1_OUI")).cible_issue_id).toBeDefined();
  });
});

describe("un retour qui relève de l'organisation pénitentiaire (point 34)", () => {
  const administratif = qualifie("2_NON");
  const cibles = ciblesDe(administratif) as Cibles;

  it("ne pose plus rien après les contextes", () => {
    expect(posee("P2/trajet", "Q2.3.1", administratif)).toBeUndefined();
  });

  it("ne complète pas P2 : les règles ne concluent pas", () => {
    expect(faits(administratif).fait_p2_complete.value).toBeUndefined();
    expect(cibles.cible_issue_id).toBeUndefined();
  });

  it("oriente vers l'administration pénitentiaire, sans rien à compléter", () => {
    const resultat = model.result.content(lectureDe(administratif));
    expect(resultat).toMatchObject({
      title: "Ce retour relève de l’organisation pénitentiaire",
    });
    expect(resultat).not.toHaveProperty("sheet");
    expect(model.cerfa.startLabel(cibles)).toBeNull();
  });
});

describe("une sortie définitive vers la prison", () => {
  it("établit le séjour, sans transfert, Centre 15 ni permission", () => {
    expect(valeurs(SORTIE, DE_LA_SORTIE)).toEqual([true, false, false, false]);
  });

  it("ne pose pas Q2.5, même séjour coché et permission écartée", () => {
    const sejour: Reponses = {
      ...SORTIE,
      "Q2.2.1": ["1_HOSPITALISATION", "3_AUTRE_CADRE"],
      "Q2.2.1.a": "2_NON",
    };
    expect(posee("P2/transfert", "Q2.5", sejour)).toBeUndefined();
    expect(valeurs(sejour, DE_LA_SORTIE)).toEqual([true, false, false, false]);
    expect(
      posee("P2/transfert", "Q2.5", {
        ...sejour,
        "Q2.2.1": ["1_HOSPITALISATION"],
      }),
    ).toBeDefined();
  });

  it("laisse une permission à sa branche", () => {
    const permission: Reponses = {
      ...SORTIE,
      "Q2.2.1": ["1_HOSPITALISATION", "3_AUTRE_CADRE"],
      "Q2.2.1.a": "1_OUI",
    };
    expect(faits(permission).fait_permission.value).toBe(true);
  });

  it("laisse les règles calculer l'issue", () => {
    expect(ciblesDe({ ...SORTIE, ...TRAJET }).cible_issue_id).toBeDefined();
  });
});

describe("un transfert vers la prison", () => {
  const transfert = (deplacement: Reponses["Q2.5"]): Reponses => ({
    ...AVEC_UN_PROFESSIONNEL,
    "Q2.1": "9_TRANSFERT",
    ...RETOUR,
    ...TRAJET,
    "Q2.5": deplacement,
  });

  it("entre établissements, se refuse", () => {
    expect(
      incoherences("P2/transfert", "Q2.5", transfert("1_TRANSFERT")),
    ).toEqual([TRANSFERT_VERS_LA_PRISON]);
  });

  it("pendant l'hospitalisation, suit Q2.5 et Q2.6", () => {
    expect(
      incoherences("P2/transfert", "Q2.5", transfert("2_AUTRE_DEPLACEMENT")),
    ).toEqual([]);
  });
});
