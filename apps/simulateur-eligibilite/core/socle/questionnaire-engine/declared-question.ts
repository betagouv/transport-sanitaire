// Ce que toute question déclarée règle, quelle que soit sa sorte, et ce qu'elle
// en fait quand elle se pose. Chaque sorte en dit plus dans sa classe
// (`declared-choices.ts`, `declared-inputs.ts`).
//
// Une question se déclare réglage par réglage, chacun sur sa ligne :
//
//   question.datetime("Q2.8.2", "Quand commence la première permission ?")
//     .appliesWhen(unMineurDeVingtAns)
//     .inconsistentWhen(commenceAvantLHospitalisation, "La permission …");
//
// Elle ne change pas : chaque réglage donne une copie. Il n'y a pas d'étape
// finale : la page la prend telle quelle (`declared-page.ts`), et le moteur de
// questionnaire lui demande comment elle se pose (`askedIn`).

import type { AskedCommonData, InPlace, ShownUnder } from "./asked-common.ts";
import type { AskedQuestion } from "./asked-question.ts";
import {
  type Condition,
  NOTHING,
  type Reading,
  type Reads,
  readsOf,
  type Text,
  textIn,
} from "./condition.ts";
import type { AnyQuestions, NotAsked, Reminder } from "./question.ts";
import type {
  Pipeline,
  QuestionContext,
  SeenAnswers,
} from "./question-context.ts";
import { checkReads, readIn } from "./reads-in-place.ts";

/** Rien de calculé : le rappel fixe de `reminder` vaut. */
type NothingComputed = undefined;

/** Ce que toute question déclarée règle, quelle que soit sa sorte. */
export type CommonSettings<Questions extends AnyQuestions, Cibles, Faits> = {
  readonly id: keyof Questions & string;
  readonly label: string;
  /** Ce qui calcule les faits et les cibles que lisent ses conditions. */
  readonly pipeline: Pipeline<Faits, Cibles>;
  readonly conditions: readonly Condition[];
  readonly inconsistencies: readonly Inconsistency[];
  readonly dependsOn: readonly string[];
  readonly hint?: string;
  readonly reminder?: Reminder;
  readonly optional?: boolean;
  readonly alwaysAsked?: boolean;
  readonly under?: ShownUnder;
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
   * La question a un sens quand cette condition tient : elle porte sur ce que
   * les réponses disent du patient. Elle se pose quand toutes ses conditions
   * tiennent, `appliesWhen` comme `mattersWhile`.
   */
  appliesWhen(condition: Condition): this {
    return this.withSettings({
      conditions: [...this.settings.conditions, condition],
    });
  }

  /**
   * La question est utile tant que cette condition tient : sa réponse peut
   * encore changer l'issue. Elle lit d'ordinaire un fait ou une cible.
   */
  mattersWhile(condition: Condition): this {
    return this.withSettings({
      conditions: [...this.settings.conditions, condition],
    });
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
   * La question s'affiche juste sous cette option d'une liste de cases de la
   * même page, et non à son rang. Elle reste une question à part, avec sa
   * légende : sa garde se déclare toujours par `appliesWhen`.
   */
  shownUnder<Id extends keyof Questions & string>(
    question: Id,
    option: Questions[Id] extends readonly (infer O)[] ? O & string : never,
  ): this {
    return this.withSettings({ under: { question, option } });
  }

  /** La question qui l'affiche sous l'une de ses options (`shownUnder`). */
  get shownUnderQuestion(): string | InPlace {
    return this.settings.under?.question;
  }

  /**
   * La question se pose même si sa réponse ne change rien de ce qui compte
   * (#255) : le filtrage par le graphe ne la saute pas. Une question que rien
   * ne lit attend ainsi la décision de l'éditeur.
   */
  alwaysAsked(): this {
    return this.withSettings({ alwaysAsked: true });
  }

  /** Le filtrage par le graphe ne la saute pas (`alwaysAsked`). */
  get isAlwaysAsked(): boolean {
    return this.settings.alwaysAsked === true;
  }

  /**
   * La réponse en contredit une autre quand `condition` tient : `message` dit
   * quoi corriger. Il peut citer les réponses : il les lit alors comme la
   * condition. La règle se déclare sur la plus tardive des questions qu'elle
   * lit : le socle refuse qu'elle en lise une d'après.
   */
  inconsistentWhen(condition: Condition, message: Text): this {
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

  /** Ce que lisent ses gardes, celles de ses options comprises. */
  get guardReads(): Reads {
    return readsOf(this.conditionReads, this.ownGuardReads());
  }

  /** Ce que lisent ses conditions, sans ses options. */
  get conditionReads(): Reads {
    return this.settings.conditions
      .map((guard) => guard.reads)
      .reduce(readsOf, NOTHING);
  }

  /** Ce que lisent ses incohérences. `null` : elle n'en a pas. */
  get inconsistencyReads(): Reads | null {
    const { inconsistencies } = this.settings;
    if (inconsistencies.length === 0) return null;
    return inconsistencies
      .map(({ condition }) => condition.reads)
      .reduce(readsOf, NOTHING);
  }

  /** Ce que lisent les gardes de ce que sa sorte ajoute : ses options. */
  protected ownGuardReads(): Reads {
    return NOTHING;
  }

  /**
   * La question telle qu'elle se pose, vu les réponses, si elle s'y pose. Ses
   * incohérences lisent `earlier`, qui voit aussi sa propre réponse.
   */
  askedIn(
    seen: SeenAnswers<Questions, Cibles | undefined>,
    earlier: SeenAnswers<Questions, Cibles | undefined>,
  ): AskedQuestion | NotAsked {
    const { settings } = this;
    checkReads(settings, seen, earlier);
    const now = readIn(seen, settings.pipeline);
    if (!settings.conditions.every((guard) => guard.in(now.reading)))
      return undefined;
    const before = readIn(earlier, settings.pipeline);
    const common = commonIn(settings, now.context, before.reading);
    return this.askedWith(common, now.context, now.reading);
  }

  /** La question posée, avec ce que sa sorte y ajoute. */
  protected abstract askedWith(
    common: AskedCommonData,
    context: QuestionContext<Questions, Cibles, Faits>,
    reading: Reading,
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

// Une incohérence : sa condition, et le message qui dit quoi corriger.
type Inconsistency = { readonly condition: Condition; readonly message: Text };

// Ce qui se lit autour du champ, vu les réponses : le libellé, le rappel, et
// les incohérences.
function commonIn<Questions extends AnyQuestions, Cibles, Faits>(
  settings: CommonSettings<Questions, Cibles, Faits>,
  context: QuestionContext<Questions, Cibles, Faits>,
  earlier: Reading,
): AskedCommonData {
  return {
    id: settings.id,
    label: settings.labelFrom?.(context) ?? settings.label,
    hint: settings.hint,
    reminder: settings.reminderFrom?.(context) ?? settings.reminder,
    optional: settings.optional,
    under: settings.under,
    inconsistencies: settings.inconsistencies
      .filter(({ condition }) => condition.in(earlier))
      .map(({ message }) => textIn(message, earlier)),
  };
}
