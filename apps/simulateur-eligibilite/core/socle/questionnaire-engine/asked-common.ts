// Ce que toute question posée porte, quelle que soit sa sorte : son libellé du
// moment, son rappel, ses incohérences. Et ce qu'elle sait d'une réponse : ce
// qu'elle en garde, si elle suffit, ce qui n'y va pas.
//
// Une question posée ne porte que des données : elle passe en JSON, telle
// qu'une API la donnera, et `askedQuestion` la relit (`asked-question.ts`).
// Chaque sorte en dit plus dans sa classe.

import { type AnswerProblem, type NoError, stated } from "./answer-problem.ts";
import type { Answer, Reminder, Unanswered } from "./question.ts";

/** Une saisie libre, sans options. */
type FreeInput = undefined;

/** L'option d'une liste de cases sous laquelle la question s'affiche. */
export type ShownUnder = { readonly question: string; readonly option: string };

/** La question s'affiche à son rang dans la page. */
export type InPlace = undefined;

/** Ce que toute question posée porte. */
export type AskedCommonData = {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly reminder?: Reminder;
  readonly optional?: boolean;
  readonly under?: ShownUnder;
  readonly inconsistencies?: readonly string[];
};

/** Une question telle qu'elle se pose, sans ce que sa sorte y ajoute. */
export class AskedCommon {
  readonly id: string;
  /** Le libellé du moment. */
  readonly label: string;
  /** Phrase indicative, affichée sous la question. */
  readonly hint: string | undefined;
  /** Le rappel du moment, affiché juste avant la question. */
  readonly reminder: Reminder | undefined;
  /** La question peut rester sans réponse : sa page se valide sans elle. */
  readonly optional: boolean;
  /** L'option sous laquelle elle s'affiche, sur la même page. */
  readonly under: ShownUnder | InPlace;
  /**
   * Ce qui, dans la réponse, en contredit une autre : un message par
   * incohérence. Tant qu'il en reste, la question n'est pas validée.
   */
  readonly inconsistencies: readonly string[];

  constructor(data: AskedCommonData) {
    this.id = data.id;
    this.label = data.label;
    this.hint = data.hint;
    this.reminder = data.reminder;
    this.optional = data.optional ?? false;
    this.under = data.under;
    this.inconsistencies = data.inconsistencies ?? [];
  }

  /**
   * Ce que la question garde de cette réponse : les seules options qui s'y
   * proposent, les seuls champs qui s'y demandent. `undefined` : rien.
   */
  kept(answer: Answer | Unanswered): Answer | Unanswered {
    return answer;
  }

  /**
   * Les valeurs qu'une réponse peut porter, l'option exclusive comprise.
   * Sans options : une saisie libre.
   */
  offeredValues(): readonly string[] | FreeInput {
    return undefined;
  }

  /** La réponse suffit-elle à quitter la question ? */
  isAnsweredBy(answer: Answer | Unanswered): boolean {
    const kept = this.kept(answer);
    if (kept === undefined) return this.optional;
    return this.problemsWith(kept).length === 0;
  }

  /**
   * Ce qui ne va pas dans une saisie. Vide quand elle convient, ou quand il n'y
   * a encore rien à corriger. Une erreur de format s'affiche seule. Sinon,
   * chaque incohérence avec une autre réponse a la sienne.
   */
  problemsWith(answer: Answer | Unanswered): readonly AnswerProblem[] {
    if (answer === undefined) return [];
    const problem = this.formatProblemOf(answer);
    if (problem !== undefined) return [problem];
    return this.inconsistencies.map(stated);
  }

  /** Ce qui ne va pas dans la saisie elle-même. Chaque sorte dit le sien. */
  protected formatProblemOf(_answer: Answer): AnswerProblem | NoError {
    return undefined;
  }
}
