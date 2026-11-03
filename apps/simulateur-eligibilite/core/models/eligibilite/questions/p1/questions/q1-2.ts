// Q1.2 : les aides ou conditions du transport. Elle ne se pose qu'avec un
// professionnel (Q1.1).

import { given, question } from "../../question.ts";

const avecUnProfessionnel = given
  .question("Q1.1")
  .answer()
  .is("3_AVEC_UN_PROFESSIONNEL");

export const Q1_2 = question
  .multipleChoice(
    "Q1.2",
    "Quelles aides ou conditions particulières sont nécessaires pendant le transport ?",
  )
  .appliesWhen(avecUnProfessionnel)
  .dependsOn("Q1.1")
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
