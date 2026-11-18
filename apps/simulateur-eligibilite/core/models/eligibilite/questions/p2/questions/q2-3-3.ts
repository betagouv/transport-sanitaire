// Q2.3.3 : la série de transports. Elle se révèle sous la distance quand le
// trajet dépasse 50 km, dans le panneau de la tranche choisie
// (NAV-PANNEAUX-GENERAL-20261116).

import { given, question } from "../../question.ts";
import { Q2_3_1 } from "./q2-3-1.ts";

export const Q2_3_3 = question
  .singleChoice(
    "Q2.3.3",
    "Pour le même traitement, prévoyez-vous de prescrire au moins 4 transports de plus de 50 km chacun sur une période de 2 mois ?",
  )
  .possibleAnswers({
    "1_OUI": "Oui.",
    "2_NON": "Non.",
  })
  .hint("Un aller-retour compte pour deux transports.")
  .mattersWhile(given.fait("fait_distance_plus_50").isOui())
  .shownUnder(Q2_3_1, "2_PLUS_DE_CINQUANTE_KM")
  .shownUnder(Q2_3_1, "3_PLUS_DE_CENT_CINQUANTE_KM");
