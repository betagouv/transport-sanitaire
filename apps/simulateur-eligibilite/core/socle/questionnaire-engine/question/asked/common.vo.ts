// Ce que toute question posée porte, quelle que soit sa sorte : son libellé du
// moment, son rappel, ses incohérences et les réponses qu'elles invitent à
// revoir. Et ce qu'elle sait d'une réponse : ce
// qu'elle en garde, si elle suffit, ce qui n'y va pas.
//
// Une question posée ne porte que des données : elle passe en JSON, telle
// qu'une API la donnera, et `askedQuestion` la relit (`question/asked/question.vo.ts`).
// Chaque sorte en dit plus dans sa classe.

import type { Answer, Reminder, Unanswered } from "../question.types.ts";
import {
  type AnswerProblem,
  type NoError,
  stated,
} from "./answer-problem.vo.ts";

/** Une saisie libre, sans réponses possibles. */
type FreeInput = undefined;

/**
 * Une réponse sous laquelle la question peut s'afficher : la réponse possible
 * d'un choix, ou la case cochée d'une case seule, sans réponse possible.
 */
export type ShownUnder = {
  readonly question: string;
  readonly possibleAnswer?: string;
};

/**
 * Une réponse d'avant qu'une incohérence invite à revoir : la question, et le
 * libellé du lien qui y mène.
 */
export type Revisit = { readonly label: string; readonly question: string };

/** Ce que toute question posée porte. */
export type AskedCommonData = {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly reminder?: Reminder;
  readonly optional?: boolean;
  readonly under?: readonly ShownUnder[];
  readonly inconsistencies?: readonly string[];
  readonly revisits?: readonly Revisit[];
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
  /**
   * Les réponses sous lesquelles elle peut s'afficher, dans l'ordre déclaré :
   * celles dont la condition tient. L'écran la place sous celle de sa page
   * sélectionnée la première, sinon à son rang.
   */
  readonly under: readonly ShownUnder[];
  /**
   * Ce qui, dans la réponse, en contredit une autre : un message par
   * incohérence. Tant qu'il en reste, la question n'est pas validée.
   */
  readonly inconsistencies: readonly string[];
  /**
   * Les réponses d'avant que ses incohérences invitent à revoir. La simulation
   * dit lesquelles se rouvrent (`Simulation.revisit`).
   */
  readonly revisits: readonly Revisit[];

  constructor(data: AskedCommonData) {
    this.id = data.id;
    this.label = data.label;
    this.hint = data.hint;
    this.reminder = data.reminder;
    this.optional = data.optional ?? false;
    this.under = data.under ?? [];
    this.inconsistencies = data.inconsistencies ?? [];
    this.revisits = data.revisits ?? [];
  }

  /**
   * Ce que la question garde de cette réponse : les seules réponses possibles
   * qui s'y proposent, les seuls champs qui s'y demandent. `undefined` : rien.
   */
  kept(answer: Answer | Unanswered): Answer | Unanswered {
    return answer;
  }

  /**
   * Les valeurs qu'une réponse peut porter, la réponse possible exclusive
   * comprise. Sans réponses possibles : une saisie libre.
   */
  offeredValues(): readonly string[] | FreeInput {
    return undefined;
  }

  /** La réponse suffit-elle à quitter la question ? Saisie, et cohérente. */
  isAnsweredBy(answer: Answer | Unanswered): boolean {
    if (!this.isFilledBy(answer)) return false;
    return this.problemsWith(this.kept(answer)).length === 0;
  }

  /**
   * La saisie est complète, et rien n'y va mal en elle-même. Elle peut encore
   * contredire une autre réponse.
   */
  isFilledBy(answer: Answer | Unanswered): boolean {
    const kept = this.kept(answer);
    if (kept === undefined) return this.optional;
    return this.formatProblemsWith(kept).length === 0;
  }

  /**
   * Ce qui ne va pas dans une saisie. Vide quand elle convient, ou quand il n'y
   * a encore rien à corriger. Une erreur de format s'affiche seule. Sinon,
   * chaque incohérence avec une autre réponse a la sienne.
   */
  problemsWith(answer: Answer | Unanswered): readonly AnswerProblem[] {
    const own = this.formatProblemsWith(answer);
    if (answer === undefined || own.length > 0) return own;
    return this.inconsistencies.map(stated);
  }

  /** Ce qui ne va pas dans la saisie elle-même, sans ses incohérences. */
  formatProblemsWith(answer: Answer | Unanswered): readonly AnswerProblem[] {
    if (answer === undefined) return [];
    const problem = this.formatProblemOf(answer);
    return problem === undefined ? [] : [problem];
  }

  /**
   * Cette réponse bloque-t-elle sur une réponse possible qui propose de faire
   * une nouvelle simulation ? Seule une question à choix peut le dire.
   */
  offersRestartOn(_answer: Answer | Unanswered): boolean {
    return false;
  }

  /** Ce qui ne va pas dans la saisie elle-même. Chaque sorte dit le sien. */
  protected formatProblemOf(_answer: Answer): AnswerProblem | NoError {
    return undefined;
  }
}
