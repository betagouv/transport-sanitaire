// Q2.3.2.terrestre : la partie terrestre d'un trajet en avion ou en bateau de
// ligne régulière (v10.2.1, R02). Elle se révèle sous la case Q2.3.2 quand
// celle-ci est cochée, et reste à l'écran une fois répondue. Décocher la case
// efface sa réponse : recochée, la question revient vide.
//
// La case est toujours sur la page du trajet : aucune autre question ne dit la
// ligne régulière. Le bloc autonome que prévoit l'éditeur, pour une ligne
// acquise ailleurs, n'a donc pas lieu d'être.
//
// La réponse est une donnée de l'application (`segments.ground` chez
// l'éditeur) : aucun fait, aucune cible. R2 la lit.

import { given, question } from "../../question.ts";
import { Q2_3_2 } from "./q2-3-2.question.ts";

export const Q2_3_2_TERRESTRE = question
  .singleChoice(
    "Q2.3.2.terrestre",
    "Pour ce déplacement, un transport terrestre est-il également prévu avant ou après l’avion ou le bateau ?",
  )
  .possibleAnswers({
    "1_OUI": "Oui",
    "2_NON": "Non",
  })
  .hint(
    "Par exemple, en voiture, transports en commun, taxi/VSL, TPMR ou ambulance, pour rejoindre ou quitter l’aéroport ou le port.",
  )
  .appliesWhen(given.question(Q2_3_2).answer().is(true))
  .dependsOn(Q2_3_2)
  .shownUnder(Q2_3_2);
