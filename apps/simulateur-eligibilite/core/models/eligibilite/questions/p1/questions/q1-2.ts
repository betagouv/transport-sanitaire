// Q1.2 : les aides ou conditions du transport. Elle ne se pose qu'avec un
// professionnel (Q1.1).

import { given, question } from "../../question.ts";
import { Q1_1 } from "./q1-1.ts";

const avecUnProfessionnel = given
  .question(Q1_1)
  .answer()
  .is("3_AVEC_UN_PROFESSIONNEL");

export const Q1_2 = question
  .multipleChoice(
    "Q1.2",
    "Quelles aides ou conditions particulières sont nécessaires pendant le transport ?",
  )
  .options({
    "1_PAS_AUTONOME":
      "Ne peut pas se déplacer de manière autonome sur une longue distance, utiliser seul les transports en commun ou conduire un véhicule personnel en raison de sa pathologie, de son traitement ou d’un handicap.",
    "2_AIDE_TECHNIQUE":
      "Nécessite une aide technique, telle qu’un fauteuil roulant, un déambulateur ou des béquilles, et une assistance pour monter dans le véhicule ou en descendre.",
    "3_TRANSMISSION_PAR_UN_PROFESSIONNEL":
      "Nécessite, en l’absence d’un proche accompagnant, l’aide d’un professionnel pour transmettre les informations nécessaires à l’équipe soignante.",
    "4_HYGIENE":
      "Nécessite des précautions d’hygiène ou la désinfection du véhicule pour prévenir un risque infectieux, sans exigence de transport en conditions d’asepsie.",
    "5_RISQUE_DE_MALAISE":
      "Présente un risque d’effets secondaires, de malaise ou de complications pendant le transport.",
    "6_FAUTEUIL_SANS_TRANSFERT":
      "Le patient doit être transporté dans son fauteuil roulant, sans transfert vers un siège du véhicule.",
    "7_ALLONGE":
      "Doit être transporté en position allongée ou semi-assise sur un brancard, car son état ne lui permet pas de rester assis normalement pendant le transport.",
    "8_BRANCARDAGE":
      "Nécessite un brancardage ou un portage, c’est-à-dire que le patient doit être soulevé et transporté par des professionnels, y compris sur une courte distance.",
    "9_SURVEILLANCE":
      "Nécessite une surveillance constante par une personne qualifiée et la présence de matériel de secours pendant le transport, en raison d’un risque médical identifié de dégradation de son état.",
    "10_OXYGENE": "Nécessite l’administration d’oxygène pendant le transport.",
    "11_ASEPSIE":
      "L’état de santé du patient impose un transport dans des conditions d’asepsie.",
  })
  .appliesWhen(avecUnProfessionnel)
  .dependsOn(Q1_1)
  .incompatible(
    "6_FAUTEUIL_SANS_TRANSFERT",
    "7_ALLONGE",
    "Le patient voyage dans son fauteuil ou allongé sur un brancard : une seule de ces deux positions pour un même trajet.",
  )
  .incompatible(
    "4_HYGIENE",
    "11_ASEPSIE",
    "L’asepsie va au-delà des précautions d’hygiène : un seul de ces deux niveaux est retenu pour un même trajet.",
  );
