// Ce que toute question déclarée règle, quelle que soit sa sorte, et ce qu'elle
// en fait quand elle se pose. Chaque sorte en dit plus dans sa classe
// (`declared-choices.ts`, `declared-inputs.ts`).
//
// Une question se déclare réglage par réglage, chacun sur sa ligne :
//
//   question.datetime("Q2.8.2", "Quand commence la première permission ?")
//     .askedIf(mineurAPoser)
//     .inconsistentIf(
//       ({ answers }) => Permission.of(answers).commenceAvantLHospitalisation(),
//       "La permission …",
//     );
//
// Elle ne change pas : chaque réglage donne une copie. Il n'y a pas d'étape
// finale : la page la prend telle quelle (`declared-page.ts`), et le moteur de
// questionnaire lui demande comment elle se pose (`askedIn`).

import type { AskedCommonData } from "./asked-common.ts";
import type { AskedQuestion } from "./asked-question.ts";
import type { AnyQuestions, NotAsked, Reminder } from "./question.ts";
import {
  contextOf,
  type Pipeline,
  type QuestionContext,
  type SeenAnswers,
} from "./question-context.ts";

/** Rien de calculé : le rappel fixe de `reminder` vaut. */
type NothingComputed = undefined;

/** Une condition sur les réponses. Elle lit le contexte de la question. */
export type Condition<Questions extends AnyQuestions, Cibles, Faits> = (
  context: QuestionContext<Questions, Cibles, Faits>,
) => boolean;

/** Ce que toute question déclarée règle, quelle que soit sa sorte. */
export type CommonSettings<Questions extends AnyQuestions, Cibles, Faits> = {
  readonly id: keyof Questions & string;
  readonly label: string;
  /** Ce qui calcule les faits et les cibles que lisent ses conditions. */
  readonly pipeline: Pipeline<Questions, Faits, Cibles>;
  readonly conditions: readonly Condition<Questions, Cibles, Faits>[];
  readonly inconsistencies: readonly Inconsistency<Questions, Cibles, Faits>[];
  readonly dependsOn: readonly string[];
  readonly hint?: string;
  readonly reminder?: Reminder;
  readonly optional?: boolean;
  labelFrom?(context: QuestionContext<Questions, Cibles, Faits>): string;
  reminderFrom?(
    context: QuestionContext<Questions, Cibles, Faits>,
  ): Reminder | NothingComputed;
};

/** Une question déclarée, sans ce que sa sorte y ajoute. */
export abstract class DeclaredQuestion<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
  Own extends object,
> {
  abstract readonly kind: AskedQuestion["kind"];
  protected readonly settings: CommonSettings<Questions, Cibles, Faits>;
  protected readonly own: Own;

  constructor(settings: CommonSettings<Questions, Cibles, Faits>, own: Own) {
    this.settings = settings;
    this.own = own;
  }

  get id(): keyof Questions & string {
    return this.settings.id;
  }

  /**
   * La question se pose-t-elle, vu les réponses ? Chaque appel ajoute une
   * condition : elle se pose quand toutes tiennent. Après le verrou, une
   * condition lit aussi les cibles figées.
   */
  askedIf(condition: Condition<Questions, Cibles, Faits>): this {
    const conditions = [...this.settings.conditions, condition];
    return this.withSettings({ conditions });
  }

  /** Le libellé, quand il dépend des réponses. */
  labelFrom(
    label: (context: QuestionContext<Questions, Cibles, Faits>) => string,
  ): this {
    return this.withSettings({ labelFrom: label });
  }

  /** Phrase indicative, affichée sous la question. */
  hint(hint: string): this {
    return this.withSettings({ hint });
  }

  /**
   * Le rappel, affiché juste avant la question. Ce n'est pas une question : il
   * n'attend rien, et ne s'affiche que si sa question se pose.
   */
  reminder(reminder: Reminder): this {
    return this.withSettings({ reminder });
  }

  /** Le rappel, quand il dépend des réponses. Sans rien à rappeler : `reminder`. */
  reminderFrom(
    reminder: (
      context: QuestionContext<Questions, Cibles, Faits>,
    ) => Reminder | NothingComputed,
  ): this {
    return this.withSettings({ reminderFrom: reminder });
  }

  /** La question peut rester sans réponse : sa page se valide sans elle. */
  optional(): this {
    return this.withSettings({ optional: true });
  }

  /**
   * La réponse en contredit une autre quand `condition` tient : `message` dit
   * quoi corriger. Il peut citer les réponses : il les lit alors comme la
   * condition. La règle se déclare sur la plus tardive des deux questions :
   * elle ne voit pas les réponses des pages suivantes.
   */
  inconsistentIf(
    condition: Condition<Questions, Cibles, Faits>,
    message: Message<Questions, Cibles, Faits>,
  ): this {
    const inconsistency = { condition, message };
    return this.withSettings({
      inconsistencies: [...this.settings.inconsistencies, inconsistency],
    });
  }

  /**
   * Les questions dont dépend cette réponse. Quand l'une d'elles change, cette
   * réponse est effacée, et elle seule (`page-commit.ts`).
   */
  dependsOn(...ids: (keyof Questions & string)[]): this {
    return this.withSettings({
      dependsOn: [...this.settings.dependsOn, ...ids],
    });
  }

  /** Les questions dont dépend cette réponse : `dependsOn` les déclare. */
  get dependencies(): readonly string[] {
    return this.settings.dependsOn;
  }

  /**
   * La question telle qu'elle se pose, vu les réponses, si elle s'y pose. Ses incohérences lisent `earlier`, qui ne voit pas les
   * réponses des pages suivantes.
   */
  askedIn(
    seen: SeenAnswers<Questions, Cibles | undefined>,
    earlier: SeenAnswers<Questions, Cibles | undefined>,
  ): AskedQuestion | NotAsked {
    const { settings } = this;
    const context = contextOf(seen, settings.pipeline);
    if (!settings.conditions.every((condition) => condition(context)))
      return undefined;
    const before = contextOf(earlier, settings.pipeline);
    return this.askedWith(commonIn(settings, context, before), context);
  }

  /** La question posée, avec ce que sa sorte y ajoute. */
  protected abstract askedWith(
    common: AskedCommonData,
    context: QuestionContext<Questions, Cibles, Faits>,
  ): AskedQuestion;

  /** La même question, réglée autrement. Chaque sorte la refait. */
  protected abstract rebuilt(
    settings: CommonSettings<Questions, Cibles, Faits>,
    own: Own,
  ): this;

  /** La même question, avec ce réglage de sa sorte en plus. */
  protected withOwn(changes: Partial<Own>): this {
    return this.rebuilt(this.settings, { ...this.own, ...changes });
  }

  private withSettings(
    changes: Partial<CommonSettings<Questions, Cibles, Faits>>,
  ) {
    return this.rebuilt({ ...this.settings, ...changes }, this.own);
  }
}

// ---- implémentation ----

// Le message d'une incohérence : un texte, ou un texte qui cite les réponses.
type Message<Questions extends AnyQuestions, Cibles, Faits> =
  | string
  | ((context: QuestionContext<Questions, Cibles, Faits>) => string);

// Une incohérence : sa condition, et le message qui dit quoi corriger.
type Inconsistency<Questions extends AnyQuestions, Cibles, Faits> = {
  readonly condition: Condition<Questions, Cibles, Faits>;
  readonly message: Message<Questions, Cibles, Faits>;
};

// Ce qui se lit autour du champ, vu les réponses : le libellé, le rappel, et
// les incohérences.
function commonIn<Questions extends AnyQuestions, Cibles, Faits>(
  settings: CommonSettings<Questions, Cibles, Faits>,
  context: QuestionContext<Questions, Cibles, Faits>,
  earlier: QuestionContext<Questions, Cibles, Faits>,
): AskedCommonData {
  return {
    id: settings.id,
    label: settings.labelFrom?.(context) ?? settings.label,
    hint: settings.hint,
    reminder: settings.reminderFrom?.(context) ?? settings.reminder,
    optional: settings.optional,
    inconsistencies: settings.inconsistencies
      .filter(({ condition }) => condition(earlier))
      .map(({ message }) =>
        typeof message === "string" ? message : message(earlier),
      ),
  };
}
