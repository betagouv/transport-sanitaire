// Q2.7 : la tranche d'âge et le cadre de la permission, dès que la permission
// est un fait, par Q2.1 ou par Q2.2.1.a (D-107). Q2.7.a confirme la
// facturation d'un transport exceptionnel, sous le choix qui l'ouvre.

import { Q1_3 } from "../../p1/questions/q1-3.ts";
import { given, question } from "../../question.ts";

// Les options adultes de Q2.7 se proposent, sauf si Q1.3 dit un patient de
// moins de 18 ans : un fait acquis retire les choix qu'il contredit.
const desAdultesAProposer = given
  .question(Q1_3)
  .answer()
  .checked("8_MINEUR_SOINS_CONTINUS")
  .not();

export const Q2_7 = question
  .singleChoice("Q2.7", "Âge du patient pendant la période prescrite")
  .options({
    "1_MOINS_DE_SEIZE_ANS": "Moins de 16 ans.",
    "2_SEIZE_A_DIX_NEUF_ANS": "De 16 à 19 ans.",
    "3_ADULTE_AUTORISEE":
      "20 ans ou plus : permission autorisée, liée aux soins ou à l’organisation de l’établissement.",
    "4_ADULTE_A_SA_CHARGE":
      "20 ans ou plus : transport exceptionnel demandé par écrit par le patient, sans fondement médical, pouvant lui être facturé.",
  })
  .mattersWhile(given.fait("fait_permission").isOui())
  .option("3_ADULTE_AUTORISEE", (option) =>
    option.offeredWhen(desAdultesAProposer),
  )
  .option("4_ADULTE_A_SA_CHARGE", (option) =>
    option.offeredWhen(desAdultesAProposer),
  );

// Q2.7 dit un adulte qui demande par écrit un transport exceptionnel.
const aLaChargeDuPatient = given
  .question(Q2_7)
  .answer()
  .is("4_ADULTE_A_SA_CHARGE");

export const Q2_7_A = question
  .singleChoice(
    "Q2.7.a",
    "L’établissement confirme-t-il que ce transport correspond à une prestation exceptionnelle facturable au patient ?",
  )
  // La confirmation de l'option 4 de Q2.7, nommée par nous (D-107).
  .options({
    "1_OUI": "Oui, les conditions de facturation ont été vérifiées.",
    "2_NON": "Non.",
  })
  .appliesWhen(aLaChargeDuPatient)
  .dependsOn(Q2_7);
