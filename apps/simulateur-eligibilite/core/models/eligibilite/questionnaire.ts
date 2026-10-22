// Le questionnaire du modèle : ses parties, dans l'ordre du catalogue de
// l'éditeur. Les options et leurs libellés viennent des déclarations.

import { page, type QuestionnairePart } from "../../socle/index.ts";
import type { Questions } from "./declarations/questions.ts";
import { P1 } from "./p1/partie-1.ts";
import { P2 } from "./p2/partie-2.ts";
import { question } from "./question.ts";

type Partie<Cibles> = QuestionnairePart<Questions, Cibles>;

/** P0 à P2 : modifiables tant que le résultat n'est pas verrouillé. */
export const PARTS: readonly Partie<undefined>[] = [
  {
    id: "P0",
    title: "Mon besoin",
    pages: [
      page(
        "P0/1",
        question
          .singleChoice("Q0.1", "Quel est votre besoin ?")
          .option("1_VERIFIER", (option) =>
            option.description("Environ 3 minutes."),
          )
          .option("2_VERIFIER_ET_PRESCRIRE", (option) =>
            option.description("Environ 10 minutes."),
          ),
      ),
    ],
  },
  P1,
  P2,
];
