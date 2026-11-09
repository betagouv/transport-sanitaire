// fait_evenement_sans_soin : fondement autonome sans soin associé.
//
// Un soin ordinaire de Q2.1 n'est pas un événement autonome : il vaut « non ».
// L'autre motif (option 14) vaut aussi « non », en attendant l'éditeur
// (D-272) : QST-Q21-AUTRE-MOTIF ne lui donne ni « oui » ni « non », et il
// resterait alors à qualifier dans sa branche.
//
// Il suit `CORRECTIF_FAITS_SANS_REPONSE.md`, qui prime sur
// `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";

export const evenementSansSoin = unFait("fait_evenement_sans_soin")
  .nonSi(
    given
      .question("Q2.1")
      .answer()
      .isOneOf(
        "1_CONSULTATION",
        "2_DENTISTE_OU_SAGE_FEMME",
        "3_IMAGERIE",
        "4_BIOLOGIE",
        "5_PARAMEDICAL",
        "7_PSYCHOLOGUE",
        "8_HOSPITALISATION",
        "9_TRANSFERT",
        "14_AUTRE",
      ),
    "Un soin, pas un événement autonome.",
  )
  .inconnuSi(
    given.question("Q2.1").answer().isPresent(),
    "À qualifier dans sa branche.",
  )
  .sinon("Q2.1 n'est pas validée.");
