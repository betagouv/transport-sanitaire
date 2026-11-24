// Où se trouve chaque question du questionnaire : le rang de sa page, puis le
// sien. Une question peut avoir plusieurs places : sa première, puis
// ses places suivantes, chacune sur sa page et du même côté du verrou.
// « Avant » et « après » se lisent à sa première place.

import type { Page } from "../question/question.types.ts";
import { QuestionnaireDeclarationError } from "../questionnaire-declaration.error.ts";

/**
 * Où se trouve chaque question : le rang de sa page, puis le sien. Elle a une
 * place, ou plusieurs : sa première, puis ses places suivantes, chacune sur sa
 * page et du même côté du verrou (`unlessAskedBefore`). Une déclaration qui
 * s'en écarte s'arrête ici, au chargement du questionnaire.
 */
export class QuestionPositions {
  readonly #places: ReadonlyMap<string, readonly QuestionPosition[]>;

  constructor(pages: readonly Page[]) {
    const places = new Map<string, QuestionPosition[]>();
    for (const [rank, page] of pages.entries()) {
      for (const [index, question] of page.questions.entries()) {
        const earlier = places.get(question.id) ?? [];
        checkPlace(question, { page, rank }, earlier, pages);
        places.set(question.id, [...earlier, { page: rank, index }]);
      }
    }
    this.#places = places;
  }

  /** Sa première place : celle où se lisent « avant » et « après ». */
  of(id: string): QuestionPosition | NotOnAnyPage {
    return this.#places.get(id)?.[0];
  }

  /** A-t-elle une place sur une page qui suit celle de ce rang ? */
  hasPlaceAfter(id: string, page: number): boolean {
    return (this.#places.get(id) ?? []).some((place) => place.page > page);
  }
}

/** Une place dans le questionnaire. */
export type QuestionPosition = {
  readonly page: number;
  readonly index: number;
};

// ---- implémentation ----

/** La question n'est sur aucune page de ce questionnaire. */
type NotOnAnyPage = undefined;

// Une place de plus pour cette question : sur une autre page que les
// précédentes, du même côté du verrou, et marquée comme place suivante.
function checkPlace(
  question: Page["questions"][number],
  { page, rank }: { readonly page: Page; readonly rank: number },
  earlier: readonly QuestionPosition[],
  pages: readonly Page[],
): void {
  const { id, isLaterPlace } = question;
  const [first] = earlier;
  if (first === undefined) {
    if (isLaterPlace)
      throw new QuestionnaireDeclarationError(
        `${id} est une place suivante (\`unlessAskedBefore()\`) sur la page ${page.id}, mais aucune page d'avant ne la déclare.`,
      );
    return;
  }
  if (earlier.some((place) => place.page === rank))
    throw new QuestionnaireDeclarationError(
      `${id} a deux places sur la page ${page.id}.`,
    );
  if (!isLaterPlace)
    throw new QuestionnaireDeclarationError(
      `${id} se déclare deux fois. Sur la page ${page.id}, c'est une place suivante : déclare-la par \`unlessAskedBefore()\`.`,
    );
  if (pages[first.page]?.afterLock !== page.afterLock)
    throw new QuestionnaireDeclarationError(
      `${id} a une place de chaque côté du verrou : le verrou fige sa réponse, elle ne se pose plus après lui.`,
    );
}
