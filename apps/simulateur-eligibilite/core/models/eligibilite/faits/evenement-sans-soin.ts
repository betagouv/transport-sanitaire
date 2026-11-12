// fait_evenement_sans_soin : fondement autonome sans soin associé.
//
// Seule une qualification positive du même trajet l'établit : une permission
// d'un mineur admissible, d'un adulte autorisée (Q2.7 = 3), d'un adulte à sa
// charge confirmée, une convocation qualifiée en Q2.10, ou l'Engagement
// maternité. Un soin ordinaire de Q2.1 n'est pas un événement autonome : il
// vaut « non ». « Autre motif » n'établit rien, ni une convocation seulement
// signalée : le fait reste inconnu (D-282).
//
// Il suit `CONTRAT_REPONSES_FAITS.json` (son `raccordement_actuel`) et
// FAIT-EVENEMENT-SANS-SOIN-20261112.

import { unFait } from "../../../socle/index.ts";
import { given } from "./communs.ts";

export const evenementSansSoin = unFait("fait_evenement_sans_soin")
  .ouiSi(
    given.fait("fait_permission_mineur_admissible").isOui(),
    "Une permission d'un mineur, admissible.",
  )
  .ouiSi(
    given
      .fait("fait_permission")
      .isOui()
      .and(given.question("Q2.7").answer().is("3_ADULTE_AUTORISEE")),
    "Une permission d'un adulte, autorisée pour les soins ou l'organisation.",
  )
  .ouiSi(
    given.fait("fait_permission_charge_patient").isOui(),
    "Un transport exceptionnel demandé par l'adulte, confirmé.",
  )
  .ouiSi(given.fait("fait_convocation").isOui(), "Une convocation qualifiée.")
  .ouiSi(given.fait("fait_dap_maternite").isOui(), "L'Engagement maternité.")
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
      ),
    "Un soin, pas un événement autonome.",
  )
  .sinon("Aucune qualification positive du trajet.");
