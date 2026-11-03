// Le nom : une question facultative.

import { question } from "../../question.ts";

export const NOM = question
  .text("nom", "À quel nom ?")
  .hint(
    "Démontre : une question facultative. La page se valide sans elle. Sur le bon de commande, le nom se dessine là où le gabarit n'a pas de champ.",
  )
  .optional();
