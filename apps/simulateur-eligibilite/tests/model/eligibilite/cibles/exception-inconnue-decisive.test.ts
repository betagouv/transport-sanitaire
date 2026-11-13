// La garde de l'article 80 (correctif v10.1.8 du 13 novembre,
// REC-CORRECTIF-20261113) : tant qu'une exception reste inconnue et qu'aucune
// n'est établie, la décision ne se calcule pas. Une exception établie, ou une
// issue prioritaire, rend les autres inutiles. La base suit l'oracle de
// l'éditeur (`correctif_20261113_b.py`) : un transfert de l'article 80, en
// permission, au fondement autonome établi.

import { describe, expect, it } from "vitest";
import type { Faits } from "../../../../core/models/eligibilite/faits/noms";
import { type Changements, preconiser } from "./faits-de-l-oracle";

const EXCEPTIONS = [
  "fait_exception_article80_admission_sans_sejour",
  "fait_exception_article80_air_mer",
  "fait_exception_article80_had_intercurrent",
  "fait_exception_article80_usld",
  "fait_exception_article80_ehpad",
  "fait_exception_article80_radiotherapie",
  "fait_exception_article80_dialyse_domicile",
  "fait_exception_article80_admission_had",
] as const satisfies readonly (keyof Faits)[];

const ARTICLE_80: Changements = {
  fait_transfert_article80: true,
  fait_permission: true,
  fait_evenement_sans_soin: true,
};

describe("une exception de l'article 80 encore inconnue", () => {
  it.each(EXCEPTIONS)("%s, seule inconnue, empêche de décider", (exception) => {
    expect(garde({ ...ARTICLE_80, [exception]: undefined })).toEqual({
      inconnueDecisive: true,
      calculable: false,
    });
  });

  it.each(EXCEPTIONS)("%s, établie, rend les autres inutiles", (exception) => {
    expect(
      garde({ ...ARTICLE_80, ...toutesInconnues(), [exception]: true }),
    ).toEqual({ inconnueDecisive: false, calculable: true });
  });

  it("toutes écartées, la décision se calcule", () => {
    expect(garde(ARTICLE_80)).toEqual({
      inconnueDecisive: false,
      calculable: true,
    });
  });

  it("une exclusion prouvée l'emporte : elle ne compte plus", () => {
    expect(
      garde({
        ...ARTICLE_80,
        ...toutesInconnues(),
        fait_exclusion_transport_prouvee: true,
      }).inconnueDecisive,
    ).toBe(false);
  });
});

// ---- implémentation ----

function garde(changements: Changements) {
  const valeurs = preconiser(changements);
  return {
    inconnueDecisive: valeurs.cible_exception_article80_inconnue_decisive,
    calculable: valeurs.cible_decision_calculable,
  };
}

function toutesInconnues(): Changements {
  return Object.fromEntries(EXCEPTIONS.map((fait) => [fait, undefined]));
}
