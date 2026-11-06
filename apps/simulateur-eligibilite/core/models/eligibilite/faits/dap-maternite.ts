// fait_dap_maternite : dispositif Engagement maternité qualifié avec DAP.
//
// Les deux groupes de Q2.14 (`CONTRAT_Q214_GROUPES.json`) : une condition
// cochée dans chacun établit le dispositif, « Aucune » dans l'un l'écarte.
// L'examen coché en Q2.2.1 tient lieu de motif : Q2.14.motif ne se repose pas
// (QST-MAT-SEPARATION, D-272). Un groupe sans réponse le laisse à la
// maternité signalée en Q2.2.1. L'examen et l'hébergement proposés et non
// cochés l'écartent tous deux ; un seul ne nie pas l'autre.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";
import { PAS_ENCORE_ETABLI } from "./noms.ts";

const ELOIGNEMENT = given.question("Q2.14.eloignement").answer();
const MOTIF_DE_LA_DAP = given.question("Q2.14.motif").answer();
const SITUATIONS = given.question("Q2.2.1").answer();
const EXAMEN = SITUATIONS.checked("14_EXAMEN_MATERNITE");
const HEBERGEMENT = SITUATIONS.checked("15_HEBERGEMENT_MATERNITE");
const DEUX_ECARTEES = SITUATIONS.offered("14_EXAMEN_MATERNITE")
  .and(EXAMEN.not())
  .and(SITUATIONS.offered("15_HEBERGEMENT_MATERNITE"))
  .and(HEBERGEMENT.not());

export const dapMaternite = unFait("fait_dap_maternite")
  .nonSi(ELOIGNEMENT.checked("3_AUCUNE"), "Aucun éloignement éligible.")
  .nonSi(MOTIF_DE_LA_DAP.checked("3_AUCUNE"), "Aucun motif éligible.")
  .ouiSi(ELOIGNEMENT.isPresent().and(MOTIF_DE_LA_DAP.isPresent().or(EXAMEN)))
  .inconnuSi(EXAMEN.or(HEBERGEMENT), "À qualifier dans sa branche.")
  .nonSi(DEUX_ECARTEES, "L'examen et l'hébergement proposés, non cochés.")
  .sinon(PAS_ENCORE_ETABLI);
