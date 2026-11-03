// Le couvercle : une case seule, sans titre.

import { question } from "../../question.ts";

export const COUVERCLE = question
  .checkbox("couvercle", "Les tasses partent avec un couvercle.")
  .hint(
    "Démontre : une case seule sans titre. Son libellé est celui de la case, et elle répond « non » décochée, comme la précédente.",
  );
