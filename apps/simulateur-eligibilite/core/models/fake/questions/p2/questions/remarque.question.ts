// La remarque : un texte sur plusieurs lignes, facultatif.

import { question } from "../../question.ts";

export const REMARQUE = question
  .longText("remarque", "Une remarque pour le service ?")
  .hint(
    "Démontre : un texte sur plusieurs lignes. « Entrée » va à la ligne, sans valider la page. Sur le bon de commande, la remarque suit les instructions : trop longue, le résultat demande de raccourcir le texte avant le téléchargement.",
  )
  .optional();
