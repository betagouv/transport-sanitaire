// fait_permission_charge_patient : permission à charge du patient prouvée.
//
// Q2.7 ne se pose qu'avec une permission acquise : sans elle, il vaut « non ».
// Un adulte à sa charge l'établit quand l'établissement le confirme (Q2.7.a).
// La charge patient ne vaut que pour 20 ans ou plus.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { unFait } from "../../../socle/index.ts";
import { PAS_ENCORE_ETABLI, SANS_PERMISSION } from "../declarations/faits.ts";
import { given } from "./communs.ts";

const TRANCHE = given.question("Q2.7").answer();
const CONFIRMATION = given.question("Q2.7.a").answer();
const A_SA_CHARGE = TRANCHE.is("4_ADULTE_A_SA_CHARGE");

export const permissionChargePatient = unFait("fait_permission_charge_patient")
  .nonSi(given.fait("fait_permission").isNon(), SANS_PERMISSION)
  .nonSi(
    TRANCHE.isOneOf("1_MOINS_DE_SEIZE_ANS", "2_SEIZE_A_DIX_NEUF_ANS"),
    "La charge patient ne vaut que pour 20 ans ou plus.",
  )
  .ouiSi(A_SA_CHARGE.and(CONFIRMATION.is("1_OUI")))
  .nonSi(A_SA_CHARGE.and(CONFIRMATION.is("2_NON")))
  .inconnuSi(A_SA_CHARGE.and(CONFIRMATION.is("3_NE_SAIT_PAS")), "À vérifier.")
  .inconnuSi(A_SA_CHARGE, "Q2.7.a attend sa réponse.")
  .nonSi(TRANCHE.isPresent())
  .sinon(PAS_ENCORE_ETABLI);
