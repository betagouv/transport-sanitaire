// Q2.7 : la tranche d'âge et le cadre de la permission, dès que la permission
// est un fait, par Q2.1 ou par Q2.2.1.a (D-107). Q2.7.a confirme la
// facturation d'un transport exceptionnel, sous le choix qui l'ouvre.

import { given, question } from "../../question.ts";

// Les options adultes de Q2.7 se proposent, sauf si Q1.3 dit un patient de
// moins de 18 ans : un fait acquis retire les choix qu'il contredit.
const desAdultesAProposer = given
  .question("Q1.3")
  .answer()
  .checked("8_MINEUR_SOINS_CONTINUS")
  .not();

// Q2.7 dit un adulte qui demande par écrit un transport exceptionnel.
const aLaChargeDuPatient = given
  .question("Q2.7")
  .answer()
  .is("4_ADULTE_A_SA_CHARGE");

export const Q2_7 = question
  .singleChoice("Q2.7", "Âge du patient pendant la période prescrite")
  .mattersWhile(given.fait("fait_permission").isOui())
  .option("3_ADULTE_AUTORISEE", (option) =>
    option.offeredWhen(desAdultesAProposer),
  )
  .option("4_ADULTE_A_SA_CHARGE", (option) =>
    option.offeredWhen(desAdultesAProposer),
  );

export const Q2_7_A = question
  .singleChoice(
    "Q2.7.a",
    "L’établissement confirme-t-il que ce transport correspond à une prestation exceptionnelle facturable au patient ?",
  )
  .appliesWhen(aLaChargeDuPatient)
  .dependsOn("Q2.7");
