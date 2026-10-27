// fait_evenement_sans_soin : fondement autonome sans soin associé.
//
// Un soin ordinaire de Q2.1 n'est pas un événement autonome : il vaut « non ».
// Une permission, une convocation ou la maternité ne le deviennent qu'une fois
// leur branche qualifiée (Q2.7, Q2.10, Q2.14) : il reste inconnu.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { MOTIF } from "./communs.ts";

export const evenementSansSoin = unFait("fait_evenement_sans_soin")
  .nonSi(
    MOTIF.isOneOf(
      "1_CONSULTATION",
      "2_DENTISTE_OU_SAGE_FEMME",
      "3_IMAGERIE",
      "4_BIOLOGIE",
      "5_PARAMEDICAL",
      "6_SEANCE",
      "7_PSYCHOLOGUE",
      "8_HOSPITALISATION",
      "9_TRANSFERT",
      "10_CAMSP",
      "14_AUTRE",
    ),
    "Un soin, pas un événement autonome.",
  )
  .inconnuSi(MOTIF.isPresent(), "À qualifier dans sa branche.")
  .sinon("Q2.1 n'est pas validée.");
