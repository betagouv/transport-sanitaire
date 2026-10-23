// fait_ald_liee : soin en lien avec ALD et déficience.
//
// Le cas 2 de Q1.3 est coché, et une déficience est prouvée : l'aide d'un
// proche en Q1.1, ou un critère de Q1.2.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { CasParticuliers } from "../concepts/cas-particuliers.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const aldLiee: DeclarationDeFait = ({ validated }) =>
  CasParticuliers.of(validated).fondement("2_ALD");
