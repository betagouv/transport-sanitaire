// Q1.3 : les cas particuliers du patient, puis sur la même page Q1.3.b quand
// l'ALD est cochée, juste sous sa case (QST-ALD-LIEN-001), et Q1.3.a sous la
// liste quand une dialyse l'est. Décocher la case retire sa question, et sa
// réponse avec elle. La case ALD ne dit que le statut : le lien du soin avec
// l'ALD se demande à part.

import type { Questions } from "../../catalogue/catalogue.ts";
import { given, question } from "../../question.ts";

// Les critères de Q1.2 qui imposent l'ambulance.
const CRITERES_D_AMBULANCE = [
  "7_ALLONGE",
  "8_BRANCARDAGE",
  "9_SURVEILLANCE",
  "10_OXYGENE",
  "11_ASEPSIE",
] as const satisfies readonly Questions["Q1.2"][number][];

const unCritereDAmbulance = given
  .question("Q1.2")
  .answer()
  .compute((criteres) =>
    CRITERES_D_AMBULANCE.some((critere) => criteres.checked(critere)),
  );

// Le partage ne concerne que le transport assis professionnel et le TPMR. Les
// règles ne donnent le mode qu'une fois P1 complète : Q1.3 est la dernière
// question qui le fait, on la tient donc pour complète le temps de la poser.
const unModePartageable = given
  .cible("cible_mode_tap_ou_tpmr")
  .assuming("fait_p1_complete")
  .isOui();

// L'ordre d'écran de Q1.3, que son contrat fixe : le mineur suit l'ALD. Les
// slugs gardent le numéro du catalogue, et « Aucune » ferme la liste.
const ORDRE_DES_CAS = [
  "1_FORTE_CORPULENCE",
  "2_ALD",
  "8_MINEUR_SOINS_CONTINUS",
  "3_CHIMIOTHERAPIE",
  "4_RADIOTHERAPIE",
  "5_DIALYSE",
  "6_PARTAGE_INCOMPATIBLE",
] satisfies readonly Questions["Q1.3"][number][];

export const Q1_3 = question
  .multipleChoice(
    "Q1.3",
    "Avant d’établir le mode de transport adéquat, sélectionnez tous les éventuels cas particuliers concernant le patient.",
  )
  .order(...ORDRE_DES_CAS)
  .exclusive("7_AUCUNE")
  // La corpulence ne compte qu'avec un motif d'ambulance. Retiré en Q1.2, il
  // emporte la réponse.
  .option("1_FORTE_CORPULENCE", (option) =>
    option.offeredWhen(unCritereDAmbulance),
  )
  .option("6_PARTAGE_INCOMPATIBLE", (option) =>
    option.offeredWhen(unModePartageable),
  );

export const Q1_3_B = question
  .singleChoice(
    "Q1.3.b",
    "Précisez le lien entre le transport et l'Affection Longue Durée (ALD) de votre patient",
  )
  .appliesWhen(given.question("Q1.3").answer().checked("2_ALD"))
  .shownUnder("Q1.3", "2_ALD");

export const Q1_3_A = question
  .singleChoice(
    "Q1.3.a",
    "La séance prévue est-elle une séance d’hémodialyse ?",
  )
  .appliesWhen(given.question("Q1.3").answer().checked("5_DIALYSE"));
