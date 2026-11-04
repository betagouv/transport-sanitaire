// La remarque : un texte sur plusieurs lignes, facultatif.

import { question } from "../../question.ts";

export const REMARQUE = question
  .longText("remarque", "Une remarque pour le service ?")
  .hint(
    "Démontre : un texte sur plusieurs lignes. « Entrée » va à la ligne, sans valider la page. Sur le bon de commande, la remarque est le commentaire facultatif des instructions : trop longue, elle en est retirée, et le résultat le dit avant le téléchargement.",
  )
  .optional();
