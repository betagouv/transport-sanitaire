// fait_dap_maternite : dispositif Engagement maternité qualifié avec DAP.
//
// Les deux groupes de Q2.14 (`CONTRAT_Q214_GROUPES.json`) : une condition
// cochée dans chacun établit le dispositif, « Aucune » dans l'un l'écarte. Un
// groupe sans réponse le laisse à la maternité signalée en Q2.2.1.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI } from "../declarations/faits.ts";
import { given, SITUATIONS } from "./communs.ts";

const ELOIGNEMENT = given.question("Q2.14.eloignement").answer();
const MOTIF_DE_LA_DAP = given.question("Q2.14.motif").answer();

export const dapMaternite = unFait("fait_dap_maternite")
  .nonSi(ELOIGNEMENT.checked("3_AUCUNE"), "Aucun éloignement éligible.")
  .nonSi(MOTIF_DE_LA_DAP.checked("3_AUCUNE"), "Aucun motif éligible.")
  .ouiSi(ELOIGNEMENT.isPresent().and(MOTIF_DE_LA_DAP.isPresent()))
  .inconnuSi(
    SITUATIONS.checked("4_MATERNITE_ELOIGNEE"),
    "À qualifier dans sa branche.",
  )
  .nonSiEcartee(SITUATIONS, "4_MATERNITE_ELOIGNEE")
  .sinon(PAS_ENCORE_ETABLI);
