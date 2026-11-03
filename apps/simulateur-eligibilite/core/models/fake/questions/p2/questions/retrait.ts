// Le retrait : une réponse qui bloque, et une qui contredit une page
// antérieure.

import { given, question } from "../../question.ts";

export const RETRAIT = question
  .singleChoice("retrait", "Comment la récupérer ?")
  .hint(
    "Démontre : une réponse qui bloque. « En livraison » affiche un message, et la page ne se valide plus. Et une réponse qui contredit une page antérieure : « À emporter » ne va pas avec « En terrasse », choisi au lieu de service. Le message nomme la question à corriger, qu'on retrouve par « Précédent ».",
  )
  .option("livraison", (option) =>
    option.blocks(
      "La livraison se commande à part. Choisissez une autre réponse pour finir cette commande, puis faites-en une seconde pour la livraison.",
    ),
  )
  .inconsistentWhen(
    given
      .question("lieu")
      .answer()
      .is("terrasse")
      .and(given.question("retrait").answer().is("a-emporter")),
    "« À emporter » ne va pas avec « En terrasse », choisi à la question « Où la servir ? ». Revenez par « Précédent » changer le lieu, ou choisissez « Sur place ».",
  );
