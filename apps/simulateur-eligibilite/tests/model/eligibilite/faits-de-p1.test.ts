// Les faits que P1 établit, chacun à trois états : « oui », « non », ou
// absent, et alors jamais transmis aux règles (D-77).
//
// `CONTRAT_REPONSES_FAITS.json` et `CORRECTIF_FAITS_SANS_REPONSE.md` disent,
// fait par fait, ce qui donne chaque état. Une question pas encore validée
// laisse ses faits absents.

import { describe, expect, it } from "vitest";
import { model } from "../../../core/models/eligibilite";
import type { Faits } from "../../../core/models/eligibilite/declarations/faits";
import type { Questions } from "../../../core/models/eligibilite/declarations/questions";
import { preconisationOf } from "../../../core/socle/model";
import type { Answers } from "../../../core/socle/questionnaire-engine/question";
import { lienAld } from "./lien-ald";

type Reponses = Answers<Questions>;

const valeur = (fait: keyof Faits, reponses: Reponses) =>
  (preconisationOf(model, reponses).faits as Faits)[fait].value;

const BESOIN: Reponses = { "Q0.1": "1_VERIFIER" };
const SEUL: Reponses = { ...BESOIN, "Q1.1": "1_SEUL", "Q1.3": ["7_AUCUNE"] };
const PRO: Reponses = { ...BESOIN, "Q1.1": "3_AVEC_UN_PROFESSIONNEL" };
const avec = (
  criteres: Questions["Q1.2"],
  cas: Questions["Q1.3"] = ["7_AUCUNE"],
  autres: Reponses = {},
): Reponses => ({
  ...PRO,
  "Q1.2": criteres,
  "Q1.3": cas,
  ...lienAld(cas),
  ...autres,
});

describe("qui aide le patient (Q1.1)", () => {
  it.each([
    ["fait_autonomie_professionnel", PRO, true],
    ["fait_autonomie_professionnel", SEUL, false],
    ["fait_accompagnant", { ...SEUL, "Q1.1": "2_AVEC_UN_PROCHE" }, true],
    ["fait_accompagnant", PRO, false],
    ["fait_autonomie_professionnel", BESOIN, undefined],
    ["fait_accompagnant", BESOIN, undefined],
  ] as const)("%s, %#", (fait, reponses, attendu) => {
    expect(valeur(fait, reponses)).toBe(attendu);
  });
});

describe("les critères (Q1.2)", () => {
  it.each([
    ["fait_critere_tap", avec(["4_HYGIENE"]), true],
    ["fait_critere_fauteuil", avec(["6_FAUTEUIL_SANS_TRANSFERT"]), true],
    ["fait_critere_allonge", avec(["7_ALLONGE"]), true],
    ["fait_critere_brancard", avec(["8_BRANCARDAGE"]), true],
    ["fait_critere_surveillance", avec(["9_SURVEILLANCE"]), true],
    ["fait_critere_oxygene", avec(["10_OXYGENE"]), true],
    ["fait_critere_asepsie", avec(["11_ASEPSIE"]), true],
    ["fait_critere_brancard", avec(["4_HYGIENE"]), false],
    ["fait_critere_tap", avec(["8_BRANCARDAGE"]), false],
  ] as const)("%s, %#", (fait, reponses, attendu) => {
    expect(valeur(fait, reponses)).toBe(attendu);
  });

  it("valent « non » quand Q1.2 ne se pose pas", () => {
    expect(valeur("fait_critere_brancard", SEUL)).toBe(false);
  });

  it("restent absents tant que Q1.2 attend sa réponse", () => {
    expect(valeur("fait_critere_brancard", PRO)).toBeUndefined();
  });
});

describe("les cas particuliers (Q1.3)", () => {
  const BRANCARD = ["8_BRANCARDAGE"] as const;

  it.each([
    [
      "fait_partage_incompatible",
      avec(["1_PAS_AUTONOME"], ["6_PARTAGE_INCOMPATIBLE"]),
      true,
    ],
    ["fait_partage_incompatible", avec(["1_PAS_AUTONOME"]), false],
    ["fait_bariatrique", avec(BRANCARD, ["1_FORTE_CORPULENCE"]), true],
    ["fait_bariatrique", avec(BRANCARD), false],
    ["fait_ald_liee", avec(BRANCARD, ["2_ALD"]), true],
    [
      "fait_ald_liee",
      { ...SEUL, "Q1.3": ["2_ALD"], "Q1.3.b": "1_LIEN_DIRECT" },
      false,
    ],
    ["fait_ald_liee", avec(BRANCARD), false],
    [
      "fait_ald_liee",
      avec(BRANCARD, ["2_ALD"], { "Q1.3.b": "2_SANS_LIEN_DIRECT" }),
      false,
    ],
    [
      "fait_ald_liee",
      avec(BRANCARD, ["2_ALD"], { "Q1.3.b": undefined }),
      undefined,
    ],
    ["fait_partage_incompatible", PRO, undefined],
    ["fait_ald_liee", { ...PRO, "Q1.2": BRANCARD }, undefined],
  ] as const)("%s, %#", (fait, reponses, attendu) => {
    expect(valeur(fait, reponses)).toBe(attendu);
  });

  it("la forte corpulence tombe avec le critère d'ambulance qui la proposait", () => {
    const reponses = avec(["1_PAS_AUTONOME"], ["1_FORTE_CORPULENCE", "2_ALD"]);
    expect(valeur("fait_bariatrique", reponses)).toBe(false);
  });
});

describe("les séances (Q1.3, Q1.3.a)", () => {
  const BRANCARD = ["8_BRANCARDAGE"] as const;
  const dialyse = (precision: Questions["Q1.3.a"]) =>
    avec(BRANCARD, ["5_DIALYSE"], { "Q1.3.a": precision });

  it.each([
    ["une chimiothérapie", avec(BRANCARD, ["3_CHIMIOTHERAPIE"]), true],
    ["une radiothérapie", avec(BRANCARD, ["4_RADIOTHERAPIE"]), true],
    ["une hémodialyse", dialyse("1_OUI"), true],
    ["une autre dialyse", dialyse("2_AUTRE_DIALYSE"), undefined],
    ["aucune séance", avec(BRANCARD), undefined],
  ] as const)("%s", (_, reponses, attendu) => {
    expect(valeur("fait_situation_soins_qualifiante", reponses)).toBe(attendu);
    expect(valeur("fait_hospitalisation", reponses)).toBe(attendu);
  });
});

describe("la préférence (Q1.4)", () => {
  it.each([
    [
      "les transports en commun",
      { ...SEUL, "Q1.4": "2_TRANSPORTS_EN_COMMUN" },
      true,
    ],
    [
      "le véhicule personnel",
      { ...SEUL, "Q1.4": "1_VEHICULE_PERSONNEL" },
      false,
    ],
    [
      "un professionnel, sans préférence à donner",
      avec(["8_BRANCARDAGE"]),
      false,
    ],
    ["une préférence pas encore donnée", SEUL, undefined],
  ] as const)("%s", (_, reponses, attendu) => {
    expect(valeur("fait_prefere_transport_commun", reponses)).toBe(attendu);
  });
});

describe("P1 complète", () => {
  it("quand chaque question qui se pose a sa réponse", () => {
    expect(valeur("fait_p1_complete", avec(["8_BRANCARDAGE"]))).toBe(true);
  });

  it("pas tant qu'une question attend, Q1.3.a comprise", () => {
    expect(valeur("fait_p1_complete", SEUL)).toBe(false);
    expect(
      valeur("fait_p1_complete", avec(["8_BRANCARDAGE"], ["5_DIALYSE"])),
    ).toBe(false);
  });

  it("laisse P2 absente", () => {
    expect(valeur("fait_p2_complete", avec(["8_BRANCARDAGE"]))).toBeUndefined();
  });
});
