// fait_ald_liee : soin en lien avec ALD et déficience.
//
// Le cas 2 de Q1.3 est coché, Q1.3.b dit un lien direct du soin avec l'ALD,
// et une déficience est prouvée : l'aide d'un proche en Q1.1, ou un critère de
// Q1.2. Sans lien direct, le fait vaut « non », quelle que soit la déficience.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`, et MET-ALD-LIEN-001 (REFERENTIEL/01).

import { unFait } from "../../../socle/index.ts";
import { AIDE, CAS, CRITERES, given } from "./communs.ts";

const LIEN = given.question("Q1.3.b").answer();
const LIEN_DIRECT = CAS.checked("2_ALD").and(LIEN.is("1_LIEN_DIRECT"));

export const aldLiee = unFait("fait_ald_liee")
  .nonSi(CAS.isPresent().and(CAS.checked("2_ALD").not()))
  .nonSi(
    CAS.checked("2_ALD").and(LIEN.is("2_SANS_LIEN_DIRECT")),
    "Le soin est sans lien direct avec l'ALD.",
  )
  .ouiSi(
    LIEN_DIRECT.and(AIDE.is("2_AVEC_UN_PROCHE")),
    "L'aide d'un proche est nécessaire.",
  )
  .nonSi(LIEN_DIRECT.and(AIDE.is("1_SEUL")), "Le patient se déplace seul.")
  .ouiSi(
    LIEN_DIRECT.and(AIDE.is("3_AVEC_UN_PROFESSIONNEL")).and(
      CRITERES.anyChecked(),
    ),
    "Un critère de Q1.2 prouve une déficience.",
  )
  .inconnuSi(
    LIEN_DIRECT,
    "Ni Q1.1 ni Q1.2 n'établissent encore une déficience.",
  )
  .inconnuSi(CAS.checked("2_ALD"), "Q1.3.b n'est pas encore validée.")
  .sinon("Q1.3 n'est pas encore validée.");
