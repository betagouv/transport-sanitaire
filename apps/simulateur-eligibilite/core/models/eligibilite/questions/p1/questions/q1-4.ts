// Q1.4 : la préférence du patient qui voyage sans professionnel (Q1.1).

import { given, question } from "../../question.ts";
import { Q1_1 } from "./q1-1.ts";

const sansProfessionnel = given
  .question(Q1_1)
  .answer()
  .isOneOf("1_SEUL", "2_AVEC_UN_PROCHE");

export const Q1_4 = question
  .singleChoice(
    "Q1.4",
    "Le patient pouvant réaliser le trajet sans intervention d’un professionnel, merci de préciser sa préférence en matière de transport.",
  )
  .options({
    "1_VEHICULE_PERSONNEL": "Véhicule personnel.",
    "2_TRANSPORTS_EN_COMMUN": "Transports en commun terrestres.",
  })
  // Le catalogue demande que le libellé précise « en toute autonomie »
  // ou « avec l’aide d’un proche », sans donner la phrase.
  .labelFrom(({ answers }) =>
    answers.question(Q1_1).is("2_AVEC_UN_PROCHE")
      ? "Le patient pouvant réaliser le trajet avec l’aide d’un proche, sans intervention d’un professionnel, merci de préciser sa préférence en matière de transport."
      : "Le patient pouvant réaliser le trajet en toute autonomie, sans intervention d’un professionnel, merci de préciser sa préférence en matière de transport.",
  )
  .appliesWhen(sansProfessionnel)
  .dependsOn(Q1_1);
