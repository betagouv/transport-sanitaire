// La place d'une page dans sa partie, parmi les pages de la partie qui se posent
// avec les réponses validées : la première, la dernière. Le journal des
// parcours en tire les jalons de chaque phase (ADR-8 d'analytics). Une réponse
// sur la dernière peut encore ouvrir une page de plus : la place change alors.

import type { CoreModel } from "../model.ts";
import type { Page } from "../questionnaire-engine/index.ts";

export type PlaceInPart = {
  /** L'id de la partie. */
  readonly part: string;
  readonly first: boolean;
  readonly last: boolean;
};

/** `asked` : les pages qui se posent à cette étape. */
export function placeInPart(
  core: CoreModel,
  asked: readonly Page[],
  page: Page,
): PlaceInPart {
  const parts = [...core.questionnaire, core.complement];
  const part = parts.find(({ pages }) => pages.includes(page));
  if (!part) throw new Error(`La page ${page.id} n'est dans aucune partie.`);
  const posed = asked.filter((each) => part.pages.includes(each));
  return {
    part: part.id,
    first: posed[0] === page,
    last: posed.at(-1) === page,
  };
}
