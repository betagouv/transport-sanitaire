// Le questionnaire du modèle : ses parties, dans l'ordre du catalogue de
// l'éditeur. Les options et leurs libellés viennent des déclarations.

import type { QuestionnairePart } from "../../socle";
import type { Cibles } from "./declarations/cibles";
import type { Questions } from "./declarations/questions";
import { P1 } from "./p1/partie-1";
import { P2 } from "./p2/partie-2";
import { question } from "./question";

type Partie<Cibles> = QuestionnairePart<Questions, Cibles>;

/** P0 à P2 : modifiables tant que le résultat n'est pas verrouillé. */
export const PARTS: readonly Partie<undefined>[] = [
  {
    id: "P0",
    title: "Mon besoin",
    pages: [
      {
        id: "P0/1",
        questions: [
          question.singleChoice("Q0.1", {
            label: "Quel est votre besoin ?",
            options: {
              "1_VERIFIER": { description: "Environ 3 minutes." },
              "2_VERIFIER_ET_PRESCRIRE": { description: "Environ 10 minutes." },
            },
          }),
        ],
      },
    ],
  },
  P1,
  P2,
];

/** P3, posée après le verrou : elle complète le cerfa, elle ne décide plus. */
export const COMPLEMENT: Partie<Cibles> = {
  id: "P3",
  title: "Informations permettant de compléter la prescription",
  pages: [],
};
