// fait_permission_mineur_admissible : permission moins de 20 ans répondant à
// R.322-10-8.
//
// Sans permission, il vaut « non ». Q2.7 dit un patient de moins de 20 ans,
// et l'autorisation de Q2.8.4 décide. Les dates, la durée, la fréquence et
// l'âge sont garantis par les blocages de la page. Le cadre de Q2.8.4.a ne
// change aucun fait.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI, SANS_PERMISSION } from "../declarations/faits.ts";
import { given } from "./communs.ts";

const TRANCHE = given.question("Q2.7").answer();
const AUTORISATION = given.question("Q2.8.4").answer();
const MOINS_DE_VINGT_ANS = TRANCHE.isOneOf(
  "1_MOINS_DE_SEIZE_ANS",
  "2_SEIZE_A_DIX_NEUF_ANS",
);

export const permissionMineurAdmissible = unFait(
  "fait_permission_mineur_admissible",
)
  .nonSi(given.fait("fait_permission").isNon(), SANS_PERMISSION)
  .nonSi(
    TRANCHE.isPresent().and(MOINS_DE_VINGT_ANS.not()),
    "L'admissibilité ne vaut que pour moins de 20 ans.",
  )
  .ouiSi(MOINS_DE_VINGT_ANS.and(AUTORISATION.is("1_OUI")))
  .nonSi(
    MOINS_DE_VINGT_ANS.and(AUTORISATION.is("2_NON")),
    "Permission non autorisée selon R.1112-56.",
  )
  .inconnuSi(
    MOINS_DE_VINGT_ANS.and(AUTORISATION.isValidated()),
    "Q2.8.4 attend sa réponse.",
  )
  .sinon(PAS_ENCORE_ETABLI);
