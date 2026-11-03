// Les accompagnements : des libellés et des options qui dépendent de la
// boisson.

import { given, question } from "../../question.ts";

const boisson = given.question("boisson").answer();

// Une boisson est choisie : la commande se poursuit.
const commandeEnCours = boisson.isPresent().and(boisson.is("rien").not());

// Le citron ne se sert qu'avec le thé.
const avecDuThe = boisson.is("the");

export const ACCOMPAGNEMENTS = question
  .multipleChoice("accompagnements", "Avec quoi ?")
  .labelFrom(({ answers }) =>
    answers.question("boisson").is("the")
      ? "Avec quoi, ce thé ?"
      : "Avec quoi, ce café ?",
  )
  .hintFrom(({ answers }) =>
    [
      "Démontre : un libellé, une aide et un libellé d'option qui dépendent des réponses (le lait devient « un nuage de lait » avec le thé), une option proposée selon la boisson (le citron, avec le thé seulement), et une option exclusive. Un fait a trois états. Le citron vaut « oui » s'il est coché, et « non » s'il se proposait sans l'être, ou avec un café, où il ne se sert pas. Avec « Peut-être du citron », on ne sait pas : le fait est absent, et le résultat ne décide pas si le lait tourne.",
      answers.question("boisson").is("the")
        ? "Cette aide le dit : c'est un thé."
        : "Cette aide le dit : c'est un café.",
    ].join(" "),
  )
  .appliesWhen(commandeEnCours)
  .dependsOn("boisson")
  .option("lait", (option) =>
    option.labelFrom(({ answers }) =>
      answers.question("boisson").is("the") ? "Un nuage de lait" : "Du lait",
    ),
  )
  .option("citron", (option) => option.offeredWhen(avecDuThe))
  .option("citron-a-voir", (option) => option.offeredWhen(avecDuThe))
  .incompatible(
    "citron",
    "citron-a-voir",
    "Le citron est demandé, ou reste à décider : seule la dernière case cochée est gardée.",
  )
  .exclusive("aucun");
