// Q1.1 : le patient se déplace seul, avec un proche ou avec un professionnel.
// Q1.2 et Q1.4 en lisent la réponse, chacune pour sa garde.

import { question } from "../../question.ts";

export const Q1_1 = question
  .singleChoice("Q1.1", "Concernant son déplacement, le patient :")
  .options({
    "1_SEUL":
      "Peut se déplacer seul, sans aide technique ou humaine et sans besoin particulier sur l’entièreté du trajet.",
    "2_AVEC_UN_PROCHE":
      "Nécessite l’accompagnement d’un proche pour se déplacer ou transmettre les informations nécessaires à l’équipe soignante, sans intervention d’un professionnel pendant le transport.",
    "3_AVEC_UN_PROFESSIONNEL":
      "Nécessite une prise en charge spécifique pendant le trajet, une aide d’un professionnel pour se déplacer ou, en l’absence d’un proche accompagnant, pour transmettre les informations nécessaires à l’équipe soignante.",
  });
