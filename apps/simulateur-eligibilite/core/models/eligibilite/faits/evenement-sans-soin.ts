// fait_evenement_sans_soin : fondement autonome sans soin associé.
//
// Il dit un fondement autonome qualifié, pas l'absence de tout soin. Une
// qualification positive du même trajet l'établit : une permission d'un
// mineur admissible, d'un adulte autorisée (Q2.7 = 3), d'un adulte à sa
// charge confirmée, une convocation qualifiée en Q2.10, ou l'Engagement
// maternité. Il vaut « non » quand la permission, la convocation et
// l'Engagement maternité sont tous trois écartés. Un soin ordinaire de Q2.1
// n'en écarte aucun, et « Autre motif » n'établit rien : le fait reste alors
// inconnu.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`, FAIT-EVENEMENT-SANS-SOIN-20261113
// (module 01) et `qualifier-evenement-autonome.mjs`.

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
      .fait("fait_permission")
      .isNon()
      .and(given.fait("fait_convocation").isNon())
      .and(given.fait("fait_dap_maternite").isNon()),
    "Ni permission, ni convocation, ni Engagement maternité.",
  )
  .sinon("Aucune qualification positive du trajet.");
