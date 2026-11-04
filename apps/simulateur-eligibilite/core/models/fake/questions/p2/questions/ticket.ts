// Le ticket : une case seule, avec un titre.

import { question } from "../../question.ts";

export const TICKET = question
  .checkbox(
    "ticket",
    "Un ticket de caisse est-il demandé ?",
    "Oui, un ticket de caisse est demandé.",
  )
  .hint(
    "Démontre : une case seule. Décochée, la page se valide et la case répond « non » : ce n'est ni une question facultative, ni une absence de réponse.",
  );
