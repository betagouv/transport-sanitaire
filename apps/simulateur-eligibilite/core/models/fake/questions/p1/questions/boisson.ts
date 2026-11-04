// La boisson : un choix unique, qui avance seul.

import { question } from "../../question.ts";

export const BOISSON = question
  .singleChoice("boisson", "Quelle boisson souhaitez-vous ?")
  .options({ the: "Un thé", cafe: "Un café", rien: "Rien" })
  .hint(
    "Démontre : des libellés en gras, une description grise sous chaque option, et l'avance immédiate après un choix unique.",
  )
  .boldLabels()
  .option("the", (option) =>
    option.description("Servi en théière, à infuser trois minutes."),
  )
  .option("cafe", (option) => option.description("Un expresso, servi court."))
  .option("rien", (option) =>
    option.description("Le questionnaire s'arrête au premier résultat."),
  );
