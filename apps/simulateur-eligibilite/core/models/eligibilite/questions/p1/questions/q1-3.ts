// Q1.3 : les cas particuliers du patient, puis sur la même page Q1.3.b quand
// l'ALD est cochée, juste sous sa case (QST-ALD-LIEN-001), et Q1.3.a sous la
// liste quand une dialyse l'est. Décocher la case retire sa question, et sa
// réponse avec elle. La case ALD ne dit que le statut : le lien du soin avec
// l'ALD se demande à part.

import type { AnswerOf } from "../../../../../socle/index.ts";
import { given, question } from "../../question.ts";
import { Q1_2 } from "./q1-2.ts";

// Les critères de Q1.2 qui imposent l'ambulance.
const CRITERES_D_AMBULANCE = [
  "7_ALLONGE",
  "8_BRANCARDAGE",
  "9_SURVEILLANCE",
  "10_OXYGENE",
  "11_ASEPSIE",
] as const satisfies readonly AnswerOf<typeof Q1_2>[number][];

const unCritereDAmbulance = given
  .question(Q1_2)
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
] as const;

export const Q1_3 = question
  .multipleChoice(
    "Q1.3",
    "Avant d’établir le mode de transport adéquat, sélectionnez tous les éventuels cas particuliers concernant le patient.",
  )
  // Dans l'ordre que le catalogue lui donne, et non celui des numéros.
  .options({
    "1_FORTE_CORPULENCE": "Présente une forte corpulence (plus de 150 kg).",
    "2_ALD":
      "Le patient est en Affection Longue Durée (ALD) exonérante reconnue.",
    "3_CHIMIOTHERAPIE": "Ce déplacement concerne une séance de chimiothérapie.",
    "4_RADIOTHERAPIE": "Ce déplacement concerne une séance de radiothérapie.",
    "5_DIALYSE": "Ce déplacement concerne une séance de dialyse en centre.",
    "6_PARTAGE_INCOMPATIBLE":
      "L’état de santé du patient n’est pas compatible avec un transport partagé.",
    "7_AUCUNE": "Aucune de ces situations.",
    "8_MINEUR_SOINS_CONTINUS":
      "Le patient a moins de 18 ans et le service médical de l’Assurance Maladie a reconnu qu’il nécessite des soins continus pendant plus de six mois, en lien avec ce déplacement.",
  })
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
  .options({
    "1_LIEN_DIRECT":
      "Soin ou examen directement lié au traitement de cette Affection Longue Durée (ALD) (soin ou examen inscrit au protocole de soins de cette Affection Longue Durée (ALD))",
    "2_SANS_LIEN_DIRECT":
      "Soin ou examen sans lien direct avec cette Affection Longue Durée (ALD) (traumatisme distinct, intercurrence, autre affection)",
  })
  .appliesWhen(given.question(Q1_3).answer().checked("2_ALD"))
  .shownUnder(Q1_3, "2_ALD");

export const Q1_3_A = question
  .singleChoice(
    "Q1.3.a",
    "La séance prévue est-elle une séance d’hémodialyse ?",
  )
  .options({
    "1_OUI": "Oui.",
    "2_AUTRE_DIALYSE": "Non, il s’agit d’une autre dialyse en centre.",
  })
  .appliesWhen(given.question(Q1_3).answer().checked("5_DIALYSE"));
