// fait_ald_liee : soin en lien avec ALD et déficience.
//
// Le cas 2 de Q1.3 est coché, Q1.3.b dit un lien direct du soin avec l'ALD,
// et une déficience est prouvée : l'aide d'un proche en Q1.1, ou un critère de
// Q1.2. Sans lien direct, le fait vaut « non », quelle que soit la déficience.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`, et MET-ALD-LIEN-001 (REFERENTIEL/01).

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";

const LIEN = given.question("Q1.3.b").answer();
const LIEN_DIRECT = given
  .question("Q1.3")
  .answer()
  .checked("2_ALD")
  .and(LIEN.is("1_LIEN_DIRECT"));

export const aldLiee = unFait("fait_ald_liee")
  .nonSi(
    given
      .question("Q1.3")
      .answer()
      .isPresent()
      .and(given.question("Q1.3").answer().checked("2_ALD").not()),
  )
  .nonSi(
    given
      .question("Q1.3")
      .answer()
      .checked("2_ALD")
      .and(LIEN.is("2_SANS_LIEN_DIRECT")),
    "Le soin est sans lien direct avec l'ALD.",
  )
  .ouiSi(
    LIEN_DIRECT.and(given.question("Q1.1").answer().is("2_AVEC_UN_PROCHE")),
    "L'aide d'un proche est nécessaire.",
  )
  .nonSi(
    LIEN_DIRECT.and(given.question("Q1.1").answer().is("1_SEUL")),
    "Le patient se déplace seul.",
  )
  .ouiSi(
    LIEN_DIRECT.and(
      given.question("Q1.1").answer().is("3_AVEC_UN_PROFESSIONNEL"),
    ).and(given.question("Q1.2").answer().anyChecked()),
    "Un critère de Q1.2 prouve une déficience.",
  )
  .inconnuSi(
    LIEN_DIRECT,
    "Ni Q1.1 ni Q1.2 n'établissent encore une déficience.",
  )
  .inconnuSi(
    given.question("Q1.3").answer().checked("2_ALD"),
    "Q1.3.b n'est pas encore validée.",
  )
  .sinon("Q1.3 n'est pas encore validée.");
