// Le questionnaire de démonstration : une commande de boisson, sans rapport
// avec le transport sanitaire.
//
// Chaque capacité du socle y a sa page, pour la voir à l'écran. L'indication
// sous une question dit ce qu'elle démontre. Les tests du socle n'en dépendent
// pas : ils tournent sur leur propre modèle.

import type { GivenAnswers, QuestionnairePart } from "../../socle/index.ts";
import type { Cibles } from "./declarations/cibles.ts";
import type { Questions } from "./declarations/questions.ts";
import { dayFromToday } from "./jour.ts";
import { cibles } from "./preconisation.ts";
import { question, questionDuComplement } from "./question.ts";
import { CRENEAU, EXPEDITION } from "./validation-croisee.ts";

/** Modifiables tant que le résultat n'est pas verrouillé. */
export const PARTS: readonly QuestionnairePart<Questions, undefined>[] = [
  {
    id: "commande",
    title: "Questionnaire de démonstration",
    pages: [
      {
        id: "boisson",
        questions: [
          question.singleChoice("boisson", {
            label: "Quelle boisson souhaitez-vous ?",
            hint: "Démontre : une description sous chaque option, et l'avance immédiate après un choix unique.",
            options: {
              the: {
                description: "Servi en théière, à infuser trois minutes.",
              },
              cafe: { description: "Un expresso, servi court." },
              rien: {
                description: "Le questionnaire s'arrête au premier résultat.",
              },
            },
          }),
        ],
      },
      {
        id: "accompagnements",
        questions: [
          question.multipleChoice("accompagnements", {
            label: "Avec quoi ?",
            labelFrom: ({ answers }) =>
              answers.question("boisson").is("the")
                ? "Avec quoi, ce thé ?"
                : "Avec quoi, ce café ?",
            hint: "Démontre : un libellé de question et un libellé d'option qui dépendent des réponses (le lait devient « un nuage de lait » avec le thé), une option proposée selon la boisson (le citron, avec le thé seulement), et une option exclusive. Un fait a trois états. Le citron vaut « oui » s'il est coché, et « non » s'il se proposait sans l'être, ou avec un café, où il ne se sert pas. Avec « Peut-être du citron », on ne sait pas : le fait est absent, et le résultat ne décide pas si le lait tourne.",
            askedIf: ({ answers }) => commandeEnCours(answers),
            dependsOn: ["boisson"],
            options: {
              lait: {
                labelFrom: ({ answers }) =>
                  answers.question("boisson").is("the")
                    ? "Un nuage de lait"
                    : "Du lait",
              },
              citron: {
                offeredIf: ({ answers }) =>
                  answers.question("boisson").is("the"),
              },
              "citron-a-voir": {
                offeredIf: ({ answers }) =>
                  answers.question("boisson").is("the"),
              },
            },
            incompatibleOptions: [
              {
                values: ["citron", "citron-a-voir"],
                explanation:
                  "Le citron est demandé, ou reste à décider : seule la dernière case cochée est gardée.",
              },
            ],
            exclusiveOption: "aucun",
          }),
        ],
      },
      {
        id: "service",
        questions: [
          question.multipleChoice("service", {
            label: "Comment la servir ?",
            reminderFrom: ({ faits }) =>
              `Rappel de la commande : ${cibles(faits).commande}.`,
            hint: "Démontre : un rappel en une phrase au-dessus de la question (il redit des réponses déjà données, et ne demande rien : la commande est calculée en route, sur les questions validées), une aide dépliable sous son option (« Voir les préparations possibles », dont la liste dépend de la boisson), deux options incompatibles (« Très chaude » et « Glacée » : cocher l'une décoche l'autre, avec une explication), et une option exclusive conditionnelle (« Rien de particulier » ne se propose pas avec le citron, et change de libellé quand un accompagnement est choisi).",
            askedIf: ({ answers }) => commandeEnCours(answers),
            dependsOn: ["boisson", "accompagnements"],
            options: {
              preparation: {
                description: "À préciser au moment du service.",
                helpFrom: ({ answers }) => ({
                  label: "Voir les préparations possibles",
                  items: answers.question("boisson").is("the")
                    ? ["Infusé cinq minutes", "Avec une théière à part"]
                    : ["Allongé", "Serré", "Avec un verre d'eau"],
                }),
              },
              rien: {
                labelFrom: ({ answers }) =>
                  answers.question("accompagnements").checked("aucun")
                    ? "Rien de particulier"
                    : "Rien d'autre de particulier",
                offeredIf: ({ answers }) =>
                  !answers.question("accompagnements").checked("citron"),
              },
            },
            incompatibleOptions: [
              {
                values: ["chaude", "glacee"],
                explanation:
                  "Une boisson ne se sert pas à la fois très chaude et glacée : seule la dernière cochée est gardée.",
              },
            ],
            exclusiveOption: "rien",
          }),
        ],
      },
    ],
  },
];

/** Posée après le verrou : elle complète, elle ne décide plus. */
export const COMPLEMENT: QuestionnairePart<Questions, Cibles> = {
  id: "complement",
  title: "Compléter la commande",
  pages: [
    {
      id: "quantite",
      questions: [
        questionDuComplement.number("quantite", {
          label: "Combien de tasses ?",
          reminderFrom: ({ answers, cibles: { commande } }) => [
            { label: "Commande", value: commande },
            {
              label: "Service",
              value: answers
                .question("service")
                .checkedBoxes()
                .map((value) => SERVICES[value])
                .join(", "),
            },
          ],
          hint: "Démontre : un rappel en valeurs au-dessus du champ (la commande et le service, figés au verrou : ils se lisent, ils ne se modifient plus), un nombre entier, borné, avec son unité. Une décimale est refusée.",
          min: 1,
          integer: true,
          unit: "tasses",
        }),
        questionDuComplement.singleChoice("lieu", {
          dropdown: true,
          label: "Où la servir ?",
          hint: "Démontre : un choix unique en liste déroulante. La page garde son bouton.",
        }),
        questionDuComplement.text("nom", {
          label: "À quel nom ?",
          hint: "Démontre : une question facultative. La page se valide sans elle. Sur le bon de commande, le nom se dessine là où le gabarit n'a pas de champ.",
          optional: true,
        }),
        questionDuComplement.checkbox("ticket", {
          label: "Un ticket de caisse est-il demandé ?",
          box: "Oui, un ticket de caisse est demandé.",
          hint: "Démontre : une case seule. Décochée, la page se valide et la case répond « non » : ce n'est ni une question facultative, ni une absence de réponse.",
        }),
      ],
    },
    {
      id: "facturation",
      questions: [
        questionDuComplement.singleChoice("facturation", {
          label: "Où envoyer la facture ?",
          hint: "Démontre : la réponse qui dit, à la page suivante, si l'adresse est en France ou à l'étranger.",
        }),
      ],
    },
    {
      id: "adresse",
      questions: [
        questionDuComplement.address("adresse", {
          label: "À quelle adresse ?",
          hint: "Démontre : une adresse en champs séparés, avec le nom du lieu. En France, le code postal fait cinq chiffres. À l'étranger, d'après la page précédente, le pays est attendu, et le code postal est libre et facultatif. Chaque champ fautif porte son message. Revenir changer la page précédente garde l'adresse : elle se relit dans le nouveau mode.",
          withPlaceName: true,
          abroadIf: ({ answers }) =>
            answers.question("facturation").is("etranger"),
        }),
      ],
    },
    EXPEDITION,
    CRENEAU,
    {
      id: "retrait",
      questions: [
        questionDuComplement.singleChoice("retrait", {
          label: "Comment la récupérer ?",
          hint: "Démontre : une réponse qui bloque. « En livraison » affiche un message, et la page ne se valide plus. Et une réponse qui contredit une page antérieure : « À emporter » ne va pas avec « En terrasse », choisi au lieu de service. Le message nomme la question à corriger, qu'on retrouve par « Précédent ».",
          options: {
            livraison: {
              blocks:
                "La livraison se commande à part. Choisissez une autre réponse pour finir cette commande, puis faites-en une seconde pour la livraison.",
            },
          },
          inconsistenciesFrom: ({ answers }) =>
            answers.question("lieu").is("terrasse") &&
            answers.question("retrait").is("a-emporter")
              ? [
                  "« À emporter » ne va pas avec « En terrasse », choisi à la question « Où la servir ? ». Revenez par « Précédent » changer le lieu, ou choisissez « Sur place ».",
                ]
              : [],
        }),
        questionDuComplement.date("jour", {
          label: "Pour quel jour ?",
          hint: "Démontre : une date bornée, d'aujourd'hui à dans sept jours. Une date hors bornes est refusée.",
          boundsFrom: () => ({ min: dayFromToday(0), max: dayFromToday(7) }),
        }),
      ],
    },
    {
      id: "remarque",
      questions: [
        questionDuComplement.longText("remarque", {
          label: "Une remarque pour le service ?",
          hint: "Démontre : un texte sur plusieurs lignes. « Entrée » va à la ligne, sans valider la page. Sur le bon de commande, la remarque est le commentaire facultatif des instructions : trop longue, elle en est retirée, et le résultat le dit avant le téléchargement.",
          optional: true,
        }),
      ],
    },
  ],
};

// ---- implémentation ----

// Une boisson est choisie : la commande se poursuit.
function commandeEnCours(answers: GivenAnswers<Questions>): boolean {
  const boisson = answers.question("boisson");
  return boisson.hasAnswer() && boisson.isNot("rien");
}

// Les façons de servir, telles qu'on les relit une fois la commande figée.
const SERVICES: Record<Questions["service"][number], string> = {
  chaude: "très chaude",
  glacee: "glacée",
  "grande-tasse": "dans une grande tasse",
  preparation: "avec une préparation particulière",
  rien: "rien de particulier",
};
