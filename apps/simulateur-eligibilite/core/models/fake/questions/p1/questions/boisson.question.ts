// La boisson : un choix unique, qui avance seul.

import { question } from "../../question.ts";

export const BOISSON = question
  .singleChoice("boisson", "Quelle boisson souhaitez-vous ?")
  .possibleAnswers({ the: "Un thé", cafe: "Un café", rien: "Rien" })
  .hint(
    "Démontre : des libellés en gras, une description grise sous chaque option, et l'avance immédiate après un choix unique.",
  )
  .boldLabels()
  .possibleAnswer("the", (possibleAnswer) =>
    possibleAnswer.description("Servi en théière, à infuser trois minutes."),
  )
  .possibleAnswer("cafe", (possibleAnswer) =>
    possibleAnswer.description("Un expresso, servi court."),
  )
  .possibleAnswer("rien", (possibleAnswer) =>
    possibleAnswer.description(
      "Le questionnaire s'arrête au premier résultat.",
    ),
  );
