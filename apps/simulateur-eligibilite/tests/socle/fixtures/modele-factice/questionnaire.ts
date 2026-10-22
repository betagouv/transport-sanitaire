// Le questionnaire factice : trois questions sans rapport avec le transport
// sanitaire.
//
// Il garde sous test la mécanique du questionnaire : avancement automatique,
// retour, brouillon, effacement des réponses dépendantes et verrou.

import { type QuestionnairePart, questionsOf } from "../../../../front/socle";
import type { Cibles } from "./declarations/cibles";
import type { Faits } from "./declarations/faits";
import { OPTIONS, type Questions } from "./declarations/questions";
import { faits } from "./preconisation";

const question = questionsOf<Questions, Faits>({ options: OPTIONS, faits });

const questionDuComplement = questionsOf<Questions, Faits, Cibles>({
  options: OPTIONS,
  faits,
});

/** Modifiables tant que le résultat n'est pas verrouillé. */
export const PARTS: readonly QuestionnairePart<Questions, undefined>[] = [
  {
    id: "commande",
    title: "Questionnaire factice",
    pages: [
      {
        id: "boisson",
        questions: [
          question.singleChoice("boisson", {
            label: "Quelle boisson souhaitez-vous ?",
          }),
        ],
      },
      {
        id: "accompagnements",
        questions: [
          question.multipleChoice("accompagnements", {
            label: "Avec quoi ?",
            askedIf: ({ answers }) => {
              const boisson = answers.question("boisson");
              return boisson.hasAnswer() && boisson.isNot("rien");
            },
            dependsOn: ["boisson"],
            exclusiveOption: "aucun",
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
          min: 1,
          unit: "tasses",
        }),
      ],
    },
  ],
};
