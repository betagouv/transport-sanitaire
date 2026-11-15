// Ce que `answer()` lit dans une garde ou une incohérence : les questions
// posées avant elle. Sur sa page, telles que saisies, si elles se posent ; sur
// les pages d'avant, validées. Une question qui ne se pose pas n'a pas de
// réponse, même si elle en garde une d'un retour en arrière. Une réponse
// acquise avant le verrou, qui n'a pas de page ici, se lit telle quelle. Dans
// un fait, `answer()` lit la réponse validée (`ValidatedAnswers.reading`).
//
// Une garde qui lit sa propre question, ou une question d'après elle, est une
// erreur de déclaration : elle s'arrête net. Une incohérence lit sa question,
// et se déclare sur la plus tardive de celles qu'elle lit.
//
// Une question peut avoir plusieurs places (ADR-29). « Avant » et « après » se
// lisent à sa première place. Posée plus haut sur la page de la garde, à une
// place suivante, elle se lit telle que saisie.

import { ValidatedAnswer } from "../answers/validated-answers.ts";
import type { AskedQuestion } from "../question/asked/question.ts";
import type { Answers, Validated } from "../question/question.ts";
import { QuestionnaireDeclarationError } from "../questionnaire-declaration.error.ts";
import type { AnswerReading } from "./condition.ts";
import type {
  QuestionPosition,
  QuestionPositions,
} from "./question-positions.vo.ts";

type Parts = {
  readonly id: string;
  readonly at: QuestionPosition;
  readonly positions: QuestionPositions;
  /** Les questions posées avant elle sur sa page. */
  readonly onPage: ReadonlyMap<string, AskedQuestion>;
  readonly validated: Validated;
  readonly answers: Answers;
};

/** La place d'une question, et ce que ses gardes y voient. */
export class GuardPlace {
  readonly id: string;
  readonly at: QuestionPosition;
  /** Ce que les pages d'avant ont validé. */
  readonly validated: Validated;
  readonly #positions: QuestionPositions;
  readonly #onPage: ReadonlyMap<string, AskedQuestion>;
  readonly #answers: Answers;

  constructor({ id, at, positions, onPage, validated, answers }: Parts) {
    this.id = id;
    this.at = at;
    this.validated = validated;
    this.#positions = positions;
    this.#onPage = onPage;
    this.#answers = answers;
    Object.freeze(this);
  }

  /**
   * La lecture d'une garde à cette place. `own` : celle d'une incohérence, qui
   * lit aussi sa propre question.
   */
  reading({ own }: { readonly own: boolean }): AnswerReading {
    return (id) => {
      const position = this.#positions.of(id);
      if (position === undefined) return given(id, this.#answers[id]);
      if (id === this.id && own) return given(id, this.#answers[id]);
      if (id === this.id) throw readsLater(this.id, id, own);
      if (this.#onPage.has(id)) return this.#onThePage(id);
      if (!before(position, this.at)) throw readsLater(this.id, id, own);
      if (position.page < this.at.page)
        return new ValidatedAnswer(id, this.validated[id]);
      return this.#onThePage(id);
    };
  }

  // ---- implémentation ----

  // Une question de la page : saisie, si elle se pose avant la garde.
  #onThePage(id: string): ValidatedAnswer {
    const asked = this.#onPage.get(id);
    if (!asked) return new ValidatedAnswer(id, undefined);
    const offered = asked.offeredValues();
    const answer = this.#answers[id];
    return new ValidatedAnswer(id, {
      ...(offered && { offered }),
      ...(answer !== undefined && { answer }),
    });
  }
}

// Une réponse telle qu'elle est donnée, sans options proposées.
function given(id: string, answer: Answers[string]): ValidatedAnswer {
  return new ValidatedAnswer(id, answer === undefined ? undefined : { answer });
}

function before(position: QuestionPosition, at: QuestionPosition): boolean {
  return (
    position.page < at.page ||
    (position.page === at.page && position.index < at.index)
  );
}

function readsLater(
  owner: string,
  id: string,
  own: boolean,
): QuestionnaireDeclarationError {
  return new QuestionnaireDeclarationError(
    own
      ? `Une incohérence de ${owner} lit ${id}, qui se pose après : déclare-la sur ${id}.`
      : `Une garde de ${owner} lit ${id}, qui ne se pose pas avant elle.`,
  );
}
