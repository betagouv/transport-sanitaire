// Le retrait : une réponse qui bloque, et une qui contredit une page
// antérieure.

import { given, question } from "../../question.ts";
import { LIEU } from "./lieu.ts";

// La question et ses options, avant la règle qui lit sa réponse.
const retrait = question
  .singleChoice("retrait", "Comment la récupérer ?")
  .options({
    "sur-place": "Sur place",
    "a-emporter": "À emporter",
    livraison: "En livraison",
  });

export const RETRAIT = retrait
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
      .question(LIEU)
      .answer()
      .is("terrasse")
      .and(given.question(retrait).answer().is("a-emporter")),
    "« À emporter » ne va pas avec « En terrasse », choisi à la question « Où la servir ? ». Revenez par « Précédent » changer le lieu, ou choisissez « Sur place ».",
  );
