// Le questionnaire de démonstration : une commande de boisson, sans rapport
// avec le transport sanitaire.
//
// Chaque capacité du socle y a sa page, pour la voir à l'écran. L'indication
// sous une question dit ce qu'elle démontre. Les tests du socle n'en dépendent
// pas : ils tournent sur leur propre modèle.

import type { QuestionnairePart } from "../../socle";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";

/** Modifiables tant que le résultat n'est pas verrouillé. */
export const PARTS: readonly QuestionnairePart<Questions, undefined>[] = [
  {
    id: "commande",
    title: "Questionnaire de démonstration",
    pages: [
      {
        id: "boisson",
        questions: [
          {
            id: "boisson",
            kind: "single choice",
            label: "Quelle boisson souhaitez-vous ?",
            hint: "Démontre : une description sous chaque option, et l'avance immédiate après un choix unique.",
            options: [
              {
                value: "the",
                label: "Un thé",
                description: "Servi en théière, à infuser trois minutes.",
              },
              {
                value: "cafe",
                label: "Un café",
                description: "Un expresso, servi court.",
              },
              {
                value: "rien",
                label: "Rien",
                description: "Le questionnaire s'arrête au premier résultat.",
              },
            ],
          },
        ],
      },
      {
        id: "accompagnements",
        questions: [
          {
            id: "accompagnements",
            kind: "multiple choice",
            label: "Avec quoi ?",
            labelFrom: ({ boisson }) =>
              boisson === "the"
                ? "Avec quoi, ce thé ?"
                : "Avec quoi, ce café ?",
            hint: "Démontre : un libellé qui dépend des réponses, une option proposée selon la boisson (le citron, avec le thé seulement), et une option exclusive.",
            askedIf: (answers) =>
              answers.boisson !== undefined && answers.boisson !== "rien",
            dependsOn: ["boisson"],
            options: [
              { value: "lait", label: "Du lait" },
              { value: "sucre", label: "Du sucre" },
              {
                value: "citron",
                label: "Une rondelle de citron",
                offeredIf: ({ boisson }) => boisson === "the",
              },
            ],
            exclusiveOption: { value: "aucun", label: "Rien de plus" },
          },
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
        {
          id: "quantite",
          kind: "number",
          label: "Combien de tasses ?",
          hint: "Démontre : un nombre entier, borné, avec son unité. Une décimale est refusée.",
          min: 1,
          integer: true,
          unit: "tasses",
        },
        {
          id: "nom",
          kind: "text",
          label: "À quel nom ?",
          hint: "Démontre : une question facultative. La page se valide sans elle.",
          optional: true,
        },
      ],
    },
  ],
};
