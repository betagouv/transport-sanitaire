// Le service : un rappel, une aide dépliable, des options incompatibles, une
// alerte qui mène à une réponse d'avant, et la question qui s'affiche sous
// l'option qui l'ouvre.

import { constant } from "../../../../../socle/index.ts";
import { cibles } from "../../../cibles/evaluation.ts";
import { given, question } from "../../question.ts";
import { ACCOMPAGNEMENTS } from "./accompagnements.ts";
import { BOISSON } from "./boisson.ts";

const boisson = given.question(BOISSON).answer();

// Une boisson est choisie : la commande se poursuit.
const commandeEnCours = boisson.isPresent().and(boisson.is("rien").not());

// La question et ses options, avant la règle qui lit sa réponse.
const service = question
  .multipleChoice("service", "Comment la servir ?")
  .options({
    chaude: "Très chaude",
    glacee: "Glacée",
    "grande-tasse": "Dans une grande tasse",
    preparation: "Avec une préparation particulière",
    rien: "Rien de particulier",
  });

// Un café ne se sert pas glacé : la boisson, deux pages plus haut, est à revoir.
const cafeGlace = boisson
  .is("cafe")
  .and(given.question(service).answer().checked("glacee"));

export const SERVICE = service
  .reminderFrom(
    ({ faits }) => `Rappel de la commande : ${cibles(faits).commande}.`,
  )
  .hint(
    "Démontre : un rappel en une phrase au-dessus de la question (il redit des réponses déjà données, et ne demande rien : la commande est calculée en route, sur les questions validées), une aide dépliable sous son option (« Voir les préparations possibles », dont la liste dépend de la boisson), deux options incompatibles (« Très chaude » et « Glacée » : cocher l'une décoche l'autre, avec une explication), une option exclusive conditionnelle (« Rien de particulier » ne se propose pas avec le citron, et change de libellé quand un accompagnement est choisi), et une alerte qui offre un lien vers une réponse d'avant (« Glacée » ne va pas avec un café : « Revoir la boisson » rouvre sa page, et « Suivant » ramène ici).",
  )
  .appliesWhen(commandeEnCours)
  .dependsOn(BOISSON, ACCOMPAGNEMENTS)
  .option("preparation", (option) =>
    option
      .description("À préciser au moment du service.")
      .helpFrom(({ answers }) => ({
        label: "Voir les préparations possibles",
        items: answers.question(BOISSON).is("the")
          ? ["Infusé cinq minutes", "Avec une théière à part"]
          : ["Allongé", "Serré", "Avec un verre d'eau"],
      })),
  )
  .option("rien", (option) =>
    option
      .labelFrom(({ answers }) =>
        answers.question(ACCOMPAGNEMENTS).checked("aucun")
          ? "Rien de particulier"
          : "Rien d'autre de particulier",
      )
      .offeredWhen(
        given.question(ACCOMPAGNEMENTS).answer().checked("citron").not(),
      ),
  )
  .incompatible(
    "chaude",
    "glacee",
    "Une boisson ne se sert pas à la fois très chaude et glacée : seule la dernière cochée est gardée.",
  )
  .exclusive("rien")
  .inconsistentWhen(
    cafeGlace,
    "Le café ne se sert pas glacé. Choisissez une autre façon de le servir, ou revoyez la boisson.",
    {
      revisit: constant([{ label: "Revoir la boisson", question: BOISSON.id }]),
    },
  );

export const QUELLE_PREPARATION = question
  .singleChoice("quelle-preparation", "Où la préparer ?")
  .options({
    comptoir: "Préparée au comptoir",
    table: "Préparée à table, devant vous",
  })
  .hint(
    "Démontre : une question qui s'affiche juste sous l'option qui la fait apparaître, après son aide, et non sous la liste. Elle garde sa propre légende.",
  )
  .appliesWhen(given.question(SERVICE).answer().checked("preparation"))
  .shownUnder(SERVICE, "preparation");
