// Le questionnaire du modèle : ses parties, dans l'ordre du catalogue de
// l'éditeur. Les options et leurs libellés viennent des déclarations.

import { optionsFrom, type QuestionnairePart } from "../../socle";
import type { Cibles } from "./declarations/cibles";
import { OPTIONS, type Questions } from "./declarations/questions";

/** P0 à P2 : modifiables tant que le résultat n'est pas verrouillé. */
export const PARTS: readonly QuestionnairePart<Questions, undefined>[] = [
  {
    id: "P0",
    title: "Mon besoin",
    pages: [
      {
        id: "P0/1",
        questions: [
          {
            id: "Q0.1",
            kind: "single choice",
            label: "Quel est votre besoin ?",
            options: optionsFrom(OPTIONS["Q0.1"], {
              "1_VERIFIER": { description: "Environ 2 minutes." },
              "2_VERIFIER_ET_PRESCRIRE": { description: "Environ 4 minutes." },
            }),
          },
        ],
      },
    ],
  },
];

/** P3, posée après le verrou : elle complète le cerfa, elle ne décide plus. */
export const COMPLEMENT: QuestionnairePart<Questions, Cibles> = {
  id: "P3",
  title: "Informations permettant de compléter la prescription",
  pages: [],
};
