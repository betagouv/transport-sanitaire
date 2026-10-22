// Le questionnaire factice : trois questions sans rapport avec le transport
// sanitaire.
//
// Il garde sous test la mécanique du questionnaire : avancement automatique,
// retour, brouillon, effacement des réponses dépendantes et verrou.

import {
  page,
  type QuestionnairePart,
  questionsOf,
} from "../../../../core/socle";
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
      page(
        "boisson",
        question.singleChoice("boisson", "Quelle boisson souhaitez-vous ?"),
      ),
      page(
        "accompagnements",
        question
          .multipleChoice("accompagnements", "Avec quoi ?")
          .askedIf(({ answers }) => {
            const boisson = answers.question("boisson");
            return boisson.hasAnswer() && boisson.isNot("rien");
          })
          .dependsOn("boisson")
          .exclusive("aucun"),
      ),
    ],
  },
];

/** Posée après le verrou : elle complète, elle ne décide plus. */
export const COMPLEMENT: QuestionnairePart<Questions, Cibles> = {
  id: "complement",
  title: "Compléter la commande",
  pages: [
    page(
      "quantite",
      questionDuComplement
        .number("quantite", "Combien de tasses ?")
        .min(1)
        .unit("tasses"),
    ),
  ],
};
