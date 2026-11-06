// Ce que `answer()` lit, selon l'endroit (`given.ts`).
//
// Dans un fait : la réponse validée. Dans une garde ou une incohérence : les
// questions posées avant elle. Sur sa page, telles que saisies, si elles se
// posent ; sur les pages d'avant, validées. Une question qui ne se pose pas
// n'a pas de réponse, même si elle en garde une d'un retour en arrière. Une
// réponse acquise avant le verrou, qui n'a pas de page ici, se lit telle
// quelle.
//
// Une garde qui lit sa propre question, ou une question d'après elle, est une
// erreur de déclaration : elle s'arrête net. Une incohérence lit sa question,
// et se déclare sur la plus tardive de celles qu'elle lit.
//
// Une question peut avoir plusieurs places (ADR-29). « Avant » et « après » se
// lisent à sa première place. Posée plus haut sur la page de la garde, à une
// place suivante, elle se lit telle que saisie.

import {
  ValidatedAnswer,
  type ValidatedAnswers,
} from "../answers/validated-answers.ts";
import type { AskedQuestion } from "../question/asked/question.ts";
import type { Answers, Page, Validated } from "../question/question.ts";

/** Comment l'endroit voit la réponse d'une question. */
export type AnswerReading = (id: string) => ValidatedAnswer;

/** La lecture d'un fait, de R2 ou de R3 : la réponse validée. */
export function validatedReading(validated: ValidatedAnswers): AnswerReading {
  return (id) => validated.question(id);
}

/**
 * Où se trouve chaque question : le rang de sa page, puis le sien. Elle a une
 * place, ou plusieurs : sa première, puis ses places suivantes, chacune sur sa
 * page et du même côté du verrou (`unlessAskedBefore`). Une déclaration qui
 * s'en écarte s'arrête ici, au chargement du questionnaire.
 */
export class Positions {
  readonly #places: ReadonlyMap<string, readonly Position[]>;

  constructor(pages: readonly Page[]) {
    const places = new Map<string, Position[]>();
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
  of(id: string): Position | NotOnAnyPage {
    return this.#places.get(id)?.[0];
  }

  /** A-t-elle une place sur une page qui suit celle de ce rang ? */
  hasPlaceAfter(id: string, page: number): boolean {
    return (this.#places.get(id) ?? []).some((place) => place.page > page);
  }
}

/** Une place dans le questionnaire. */
export type Position = { readonly page: number; readonly index: number };

/** Ce que voient les gardes d'une question, à sa place. */
export type GuardPlace = {
  readonly id: string;
  readonly at: Position;
  readonly positions: Positions;
  /** Les questions posées avant elle sur sa page. */
  readonly onPage: ReadonlyMap<string, AskedQuestion>;
  readonly validated: Validated;
  readonly answers: Answers;
};

/**
 * La lecture d'une garde à cette place. `own` : celle d'une incohérence, qui
 * lit aussi sa propre question.
 */
export function guardReading(
  place: GuardPlace,
  { own }: { readonly own: boolean },
): AnswerReading {
  return (id) => {
    const position = place.positions.of(id);
    if (position === undefined) return given(id, place.answers[id]);
    if (id === place.id && own) return given(id, place.answers[id]);
    if (id === place.id) throw readsLater(place.id, id, own);
    if (place.onPage.has(id)) return onPage(place, id);
    if (!before(position, place.at)) throw readsLater(place.id, id, own);
    if (position.page < place.at.page)
      return new ValidatedAnswer(id, place.validated[id]);
    return onPage(place, id);
  };
}

// ---- implémentation ----

/** La question n'est sur aucune page de ce questionnaire. */
type NotOnAnyPage = undefined;

// Une place de plus pour cette question : sur une autre page que les
// précédentes, du même côté du verrou, et marquée comme place suivante.
function checkPlace(
  question: Page["questions"][number],
  { page, rank }: { readonly page: Page; readonly rank: number },
  earlier: readonly Position[],
  pages: readonly Page[],
): void {
  const { id, isLaterPlace } = question;
  const [first] = earlier;
  if (first === undefined) {
    if (isLaterPlace)
      throw new Error(
        `${id} est une place suivante (\`unlessAskedBefore()\`) sur la page ${page.id}, mais aucune page d'avant ne la déclare.`,
      );
    return;
  }
  if (earlier.some((place) => place.page === rank))
    throw new Error(`${id} a deux places sur la page ${page.id}.`);
  if (!isLaterPlace)
    throw new Error(
      `${id} se déclare deux fois. Sur la page ${page.id}, c'est une place suivante : déclare-la par \`unlessAskedBefore()\`.`,
    );
  if (pages[first.page]?.afterLock !== page.afterLock)
    throw new Error(
      `${id} a une place de chaque côté du verrou : le verrou fige sa réponse, elle ne se pose plus après lui.`,
    );
}

// Une réponse telle qu'elle est donnée, sans options proposées.
function given(id: string, answer: Answers[string]) {
  return new ValidatedAnswer(id, answer === undefined ? undefined : { answer });
}

// Une question de la page : saisie, si elle se pose avant la garde.
function onPage(place: GuardPlace, id: string) {
  const asked = place.onPage.get(id);
  if (!asked) return new ValidatedAnswer(id, undefined);
  const offered = asked.offeredValues();
  const answer = place.answers[id];
  return new ValidatedAnswer(id, {
    ...(offered && { offered }),
    ...(answer !== undefined && { answer }),
  });
}

function before(position: Position, at: Position): boolean {
  return (
    position.page < at.page ||
    (position.page === at.page && position.index < at.index)
  );
}

function readsLater(owner: string, id: string, own: boolean): Error {
  return new Error(
    own
      ? `Une incohérence de ${owner} lit ${id}, qui se pose après : déclare-la sur ${id}.`
      : `Une garde de ${owner} lit ${id}, qui ne se pose pas avant elle.`,
  );
}
