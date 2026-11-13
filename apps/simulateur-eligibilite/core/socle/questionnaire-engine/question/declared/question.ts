// La question déclarée : ses réglages, quelle que soit sa sorte
// (`question/declared/settings.ts`), et ce qu'elle en fait quand elle se pose.
// Chaque sorte en dit plus dans sa classe (`question/declared/choices.ts`,
// `question/declared/inputs.ts`).
//
// Une question se déclare réglage par réglage, chacun sur sa ligne :
//
//   question.datetime("Q2.8.2", "Quand commence la première permission ?")
//     .appliesWhen(unMineurDeVingtAns)
//     .inconsistentWhen(commenceAvantLHospitalisation, "La permission …");
//
// Elle ne change pas : chaque réglage donne une copie. Il n'y a pas d'étape
// finale : la page la prend telle quelle (`question/declared/page.ts`), et le moteur de
// questionnaire lui demande comment elle se pose (`askedIn`).

import {
  type Condition,
  NOTHING,
  type Reads,
  readsOf,
  type Scope,
  type Text,
  type Value,
} from "../../conditions/condition.ts";
import { checkReads, readIn } from "../../conditions/reads-in-place.ts";
import type { AskedCommonData, InPlace, Revisit } from "../asked/common.ts";
import type { QuestionContext, SeenAnswers } from "../asked/context.ts";
import type { AskedQuestion } from "../asked/question.ts";
import {
  type Answer,
  type AnswerOfRef,
  type AnyQuestions,
  type Dependency,
  idOf,
  type NotAsked,
  type QuestionRef,
  type Reminder,
} from "../question.ts";
import { type DependsOn, dependencyOf } from "./dependency.ts";
import {
  type CommonSettings,
  commonIn,
  type NothingComputed,
} from "./settings.ts";

/**
 * Une question déclarée, sans ce que sa sorte y ajoute. `Id` : son id.
 * `Given` : le type de sa réponse, que sa sorte et ses options disent.
 * `Questions` : ce que ses rappels et ses libellés lisent par id, rien pour un
 * modèle dont les questions se lisent par leur objet (`ReadByObject`).
 */
export abstract class DeclaredQuestion<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
  Own extends object,
  Id extends string = string,
  Given extends Answer = Answer,
> {
  abstract readonly kind: AskedQuestion["kind"];
  /** Le type de sa réponse, au typage seulement (`Answered`). */
  declare readonly "~answer": Given;
  protected readonly settings: CommonSettings<Questions, Cibles, Faits>;
  protected readonly own: Own;

  constructor(settings: CommonSettings<Questions, Cibles, Faits>, own: Own) {
    this.settings = settings;
    this.own = own;
  }

  get id(): Id {
    return this.settings.id as Id;
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

  /** La phrase indicative, quand elle dépend des réponses. */
  hintFrom(
    hint: (context: QuestionContext<Questions, Cibles, Faits>) => string,
  ): this {
    return this.withSettings({ hintFrom: hint });
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
   * La question n'attend une réponse que quand cette condition tient ; sinon
   * elle reste facultative. Comme une incohérence, la condition lit les
   * questions d'avant et celles de la même page.
   */
  requiredWhen(condition: Condition): this {
    return this.withSettings({ optional: true, requiredWhen: condition });
  }

  /**
   * La question s'affiche juste sous cette option d'une liste de cases de la
   * même page, et non à son rang. Elle reste une question à part, avec sa
   * légende : sa garde se déclare toujours par `appliesWhen`.
   */
  shownUnder<Ref extends QuestionRef<Questions>>(
    question: Ref,
    option: AnswerOfRef<Questions, Ref> extends readonly (infer O)[]
      ? O & string
      : never,
  ): this {
    return this.withSettings({ under: { question: idOf(question), option } });
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
   * Une place suivante de la question, déjà déclarée sur une page d'avant : une
   * seule réponse, sous son id. Elle ne s'y pose que si elle ne s'est pas
   * posée plus tôt (ADR-29).
   */
  unlessAskedBefore(): this {
    return this.withSettings({ laterPlace: true });
  }

  /** Une place suivante (`unlessAskedBefore`). */
  get isLaterPlace(): boolean {
    return this.settings.laterPlace === true;
  }

  /**
   * La réponse en contredit une autre quand `condition` tient : `message` dit
   * quoi corriger. Il peut citer les réponses : il les lit alors comme la
   * condition. La règle se déclare sur la plus tardive des questions qu'elle
   * lit : le socle refuse qu'elle en lise une d'après. `revisit` donne les
   * réponses d'avant à revoir, chacune avec le libellé de son lien. Il lit les
   * réponses comme la condition.
   */
  inconsistentWhen(
    condition: Condition,
    message: Text,
    { revisit }: { revisit?: Value<readonly Revisit[]> } = {},
  ): this {
    const inconsistency = { condition, message, revisit };
    return this.withSettings({
      inconsistencies: [...this.settings.inconsistencies, inconsistency],
    });
  }

  /** Ce dont dépend cette réponse : elle s'efface quand cela change. */
  dependsOn(...questions: DependsOn<Questions>[]): this {
    return this.withSettings({
      dependsOn: [...this.settings.dependsOn, ...questions.map(dependencyOf)],
    });
  }

  /** Ce dont dépend cette réponse : `dependsOn` le déclare. */
  get dependencies(): readonly Dependency[] {
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
      .flatMap(({ condition, revisit }) => [condition, revisit ?? condition])
      .map(({ reads }) => reads)
      .reduce(readsOf, NOTHING);
  }

  /** Ce que lit la condition qui la rend obligatoire. `null` : elle n'en a pas. */
  get requirementReads(): Reads | null {
    return this.settings.requiredWhen?.reads ?? null;
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
    if (!settings.conditions.every((guard) => guard.in(now.scope)))
      return undefined;
    const before = readIn(earlier, settings.pipeline);
    const common = commonIn(settings, now.context, before.scope);
    return this.askedWith(common, now.context, now.scope);
  }

  /** La question posée, avec ce que sa sorte y ajoute. */
  protected abstract askedWith(
    common: AskedCommonData,
    context: QuestionContext<Questions, Cibles, Faits>,
    scope: Scope,
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
