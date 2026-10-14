// Le questionnaire du modèle : ses parties, dans l'ordre du catalogue de
// l'éditeur. Les options et leurs libellés viennent des déclarations.

import type { QuestionnairePart } from "../../socle";
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
            options: optionsOf("Q0.1", {
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

// ---- implémentation ----

// Ce qu'une option porte en plus de son libellé.
type Details = { description?: string };

// Les options d'une question, dans l'ordre de leur déclaration.
function optionsOf<Id extends keyof typeof OPTIONS>(
  id: Id,
  details: Partial<Record<keyof (typeof OPTIONS)[Id], Details>> = {},
) {
  const slugs = Object.keys(OPTIONS[id]) as (keyof (typeof OPTIONS)[Id] &
    string)[];
  return slugs.map((slug) => ({
    value: slug,
    label: OPTIONS[id][slug] as string,
    ...details[slug],
  }));
}
