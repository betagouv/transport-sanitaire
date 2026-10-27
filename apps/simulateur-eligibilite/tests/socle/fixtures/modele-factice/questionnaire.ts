// Le questionnaire factice : trois questions sans rapport avec le transport
// sanitaire.
//
// Il garde sous test la mécanique du questionnaire : avancement automatique,
// retour, brouillon, effacement des réponses dépendantes et verrou.

import {
  afterLock,
  givenOf,
  page,
  type QuestionnairePart,
  questionsOf,
} from "../../../../core/socle";
import type { Cibles } from "./declarations/cibles";
import type { Faits } from "./declarations/faits";
import { OPTIONS, type Questions } from "./declarations/questions";
import { cibles, faits } from "./preconisation";

export const given = givenOf<Questions, Faits, Cibles>();
const boisson = given.question("boisson").answer();

const question = questionsOf<Questions, Faits, Cibles>({
  options: OPTIONS,
  faits,
  cibles,
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
          .appliesWhen(boisson.isPresent().and(boisson.is("rien").not()))
          .dependsOn("boisson")
          .exclusive("aucun"),
      ),
    ],
  },
];

/** Posée après le verrou : elle complète, elle ne décide plus. */
export const COMPLEMENT: QuestionnairePart<Questions, Cibles> = afterLock({
  id: "complement",
  title: "Compléter la commande",
  pages: [
    page(
      "quantite",
      question.number("quantite", "Combien de tasses ?").min(1).unit("tasses"),
    ),
  ],
});
