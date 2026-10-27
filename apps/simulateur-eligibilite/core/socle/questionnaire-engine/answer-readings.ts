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

import type { AskedQuestion } from "./asked-question.ts";
import type { Answers, Page, Validated } from "./question.ts";
import { ValidatedAnswer, type ValidatedAnswers } from "./validated-answers.ts";

/** Comment l'endroit voit la réponse d'une question. */
export type AnswerReading = (id: string) => ValidatedAnswer;

/** La lecture d'un fait, de R2 ou de R3 : la réponse validée. */
export function validatedReading(validated: ValidatedAnswers): AnswerReading {
  return (id) => validated.question(id);
}

/** Où se trouve chaque question : le rang de sa page, puis le sien. */
export class Positions {
  readonly #positions: ReadonlyMap<string, Position>;

  constructor(pages: readonly Page[]) {
    this.#positions = new Map(
      pages.flatMap((page, rank) =>
        page.questions.map((question, index) => [
          question.id,
          { page: rank, index },
        ]),
      ),
    );
  }

  of(id: string): Position | NotOnAnyPage {
    return this.#positions.get(id);
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
    if (!before(position, place.at)) throw readsLater(place.id, id, own);
    if (position.page < place.at.page)
      return new ValidatedAnswer(id, place.validated[id]);
    return onPage(place, id);
  };
}

// ---- implémentation ----

/** La question n'est sur aucune page de ce questionnaire. */
type NotOnAnyPage = undefined;

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
