// Le début du retrait : la première des deux réponses que la fin compare.

import { question } from "../../question.ts";

export const DEBUT = question
  .datetime("debut", "Quand commence le retrait ?")
  .hint(
    "Démontre : deux réponses de la même page qui se contredisent. La règle est sur la fin : elle lit le début, saisi juste avant.",
  );
