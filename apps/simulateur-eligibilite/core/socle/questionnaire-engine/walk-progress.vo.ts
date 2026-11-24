// Où en est le parcours du questionnaire, question après question
// (`question-walk.service.ts`) : les questions validées jusqu'ici, si aucune
// n'attend encore sa réponse, et celles qui ne se posent pas. Chaque question
// lue donne un nouvel avancement.

import type { AskedQuestion } from "./question/asked/question.vo.ts";
import type {
  Answer,
  Unanswered,
  Validated,
} from "./question/question.types.ts";

type WalkProgressData = {
  readonly validated: Validated;
  readonly complete: boolean;
  readonly pending: readonly string[];
  readonly ruledOut: readonly string[];
  readonly setAside: readonly string[];
};

/** L'avancement du parcours, à une question donnée. */
export class WalkProgress {
  /** Avant la première question : rien de validé, rien n'attend. */
  static start(): WalkProgress {
    return new WalkProgress({
      validated: {},
      complete: true,
      pending: [],
      ruledOut: [],
      setAside: [],
    });
  }

  /** Les questions validées jusqu'ici, avec ce qui s'y proposait. */
  readonly validated: Validated;
  /** Aucune question posée n'attend encore sa réponse. */
  readonly complete: boolean;
  /** Les questions qui se posent sans être validées. */
  readonly pending: readonly string[];
  // Les places où les gardes d'une question ne tiennent pas, décidées.
  readonly #ruledOut: readonly string[];
  // Les places où une question ne se pose pas sans être exclue.
  readonly #setAside: readonly string[];

  private constructor(data: WalkProgressData) {
    this.validated = data.validated;
    this.complete = data.complete;
    this.pending = data.pending;
    this.#ruledOut = data.ruledOut;
    this.#setAside = data.setAside;
    Object.freeze(this);
  }

  /** La question s'est posée plus tôt, validée ou en attente. */
  askedBefore(id: string): boolean {
    return id in this.validated || this.pending.includes(id);
  }

  /**
   * La question ne se pose pas à cette place : exclue par ses gardes
   * (`ruledOut`), ou mise de côté.
   */
  notAsked(id: string, { ruledOut }: { ruledOut: boolean }): WalkProgress {
    return ruledOut
      ? this.#with({ ruledOut: [...this.#ruledOut, id] })
      : this.#with({ setAside: [...this.#setAside, id] });
  }

  /**
   * La question se pose avec cette réponse. Elle est validée si elle a sa
   * réponse et qu'aucune n'attend avant elle. La première qui attend arrête la
   * validation pour toute la suite.
   */
  asked(question: AskedQuestion, answer: Answer | Unanswered): WalkProgress {
    const complete = this.complete && question.isAnsweredBy(answer);
    if (!complete) {
      return this.#with({ complete, pending: [...this.pending, question.id] });
    }
    return this.#with({
      validated: {
        ...this.validated,
        [question.id]: validatedAs(question, answer),
      },
    });
  }

  /**
   * Les questions devenues inapplicables : leurs gardes ne tiennent plus, à
   * toutes leurs places, alors que ce qu'elles lisent est validé. Une question
   * que le graphe masque, ou qui suit une question en attente sur une
   * page d'avant, n'en est pas : ses gardes tiennent, ou ne se décident pas
   * encore.
   */
  inapplicable(): ReadonlySet<string> {
    const kept = new Set([
      ...Object.keys(this.validated),
      ...this.pending,
      ...this.#setAside,
    ]);
    return new Set(this.#ruledOut.filter((id) => !kept.has(id)));
  }

  // ---- implémentation ----

  #with(changes: Partial<WalkProgressData>): WalkProgress {
    return new WalkProgress({
      validated: this.validated,
      complete: this.complete,
      pending: this.pending,
      ruledOut: this.#ruledOut,
      setAside: this.#setAside,
      ...changes,
    });
  }
}

// Ce qu'on retient d'une question validée : ses réponses possibles du moment,
// et sa réponse s'il y en a une.
function validatedAs(question: AskedQuestion, answer: Answer | Unanswered) {
  const offered = question.offeredValues();
  const given = question.kept(answer);
  return {
    ...(offered && { offered }),
    ...(given !== undefined && { answer: given }),
  };
}
