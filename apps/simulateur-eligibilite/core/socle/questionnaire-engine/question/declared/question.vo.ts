// La question déclarée : ses réglages, quelle que soit sa sorte
// (`question/declared/settings.types.ts`), et ce qu'elle en fait quand elle se pose.
// Chaque sorte en dit plus dans sa classe (`question/declared/choices.vo.ts`,
// `question/declared/inputs.vo.ts`).
//
// Une question se déclare réglage par réglage, chacun sur sa ligne :
//
//   question.datetime("Q2.8.2", "Quand commence la première permission ?")
//     .appliesWhen(unMineurDeVingtAns)
//     .inconsistentWhen(commenceAvantLHospitalisation, "La permission …");
//
// Elle ne change pas : chaque réglage donne une copie. Il n'y a pas d'étape
// finale : la page la prend telle quelle (`question/declared/page.vo.ts`), et le moteur de
// questionnaire lui demande comment elle se pose (`askedIn`).

import { GuardReadingService } from "../../conditions/guard-reading.service.ts";
import type { Condition, Reading, Text } from "../../conditions/reading.vo.ts";
import { Reads } from "../../conditions/reads.vo.ts";
import type { AskedCommonData, InPlace, Revisit } from "../asked/common.vo.ts";
import type { QuestionContext, SeenAnswers } from "../asked/context.vo.ts";
import type { AskedQuestion } from "../asked/question.vo.ts";
import { Dependency, type DependsOn } from "../dependency.vo.ts";
import type {
  Answer,
  AnswerOfRef,
  AnyQuestions,
  NotAsked,
  QuestionRef,
  Reminder,
} from "../question.types.ts";
import { QuestionId } from "../question-id.vo.ts";
import type { CommonSettings, NothingComputed } from "./settings.types.ts";

/**
 * Une question déclarée, sans ce que sa sorte y ajoute. `Id` : son id.
 * `Given` : le type de sa réponse, dit par sa sorte et ses réponses possibles.
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
   * La question s'affiche juste sous cette réponse possible d'une liste de
   * cases de la même page, et non à son rang. Elle reste une question à part,
   * avec sa légende : sa garde se déclare toujours par `appliesWhen`.
   */
  shownUnder<Ref extends QuestionRef<Questions>>(
    question: Ref,
    possibleAnswer: AnswerOfRef<Questions, Ref> extends readonly (infer O)[]
      ? O & string
      : never,
  ): this {
    return this.withSettings({
      under: { question: QuestionId.of(question).value, possibleAnswer },
    });
  }

  /** La question qui l'affiche sous une réponse possible (`shownUnder`). */
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
   * posée plus tôt (ADR-0040).
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
    { revisit }: { revisit?: Reading<readonly Revisit[]> } = {},
  ): this {
    const { inconsistencies } = this.settings;
    return this.withSettings({
      inconsistencies: inconsistencies.with({ condition, message, revisit }),
    });
  }

  /** Ce dont dépend cette réponse : elle s'efface quand cela change. */
  dependsOn(...questions: DependsOn<Questions>[]): this {
    return this.withSettings({
      dependsOn: [
        ...this.settings.dependsOn,
        ...questions.map((q) => Dependency.of(q)),
      ],
    });
  }

  /** Ce dont dépend cette réponse : `dependsOn` le déclare. */
  get dependencies(): readonly Dependency[] {
    return this.settings.dependsOn;
  }

  /** Ce que lisent ses gardes, celles de ses réponses possibles comprises. */
  get guardReads(): Reads {
    return this.conditionReads.with(this.ownGuardReads());
  }

  /** Ce que lisent ses conditions, sans ses réponses possibles. */
  get conditionReads(): Reads {
    return Reads.union(...this.settings.conditions.map(({ reads }) => reads));
  }

  /** Ce que lisent ses incohérences. `null` : elle n'en a pas. */
  get inconsistencyReads(): Reads | null {
    return this.settings.inconsistencies.reads;
  }

  /** Ce que lit la condition qui la rend obligatoire. `null` : elle n'en a pas. */
  get requirementReads(): Reads | null {
    return this.settings.requiredWhen?.reads ?? null;
  }

  /** Ce que lisent les gardes de ses réponses possibles, si elle en a. */
  protected ownGuardReads(): Reads {
    return Reads.none();
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
    const guards = new GuardReadingService(settings);
    guards.checkReads(seen, earlier);
    const now = guards.contextOf(seen);
    if (!settings.conditions.every((guard) => guard.in(now))) return undefined;
    const common = this.#commonIn(now, guards.contextOf(earlier));
    return this.askedWith(common, now);
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

  // Ce qui se lit autour du champ, vu les réponses. S'il peut rester vide, ses
  // incohérences et les réponses à revoir : vu aussi celles de sa page.
  #commonIn(
    context: QuestionContext<Questions, Cibles, Faits>,
    earlier: QuestionContext<Questions, Cibles, Faits>,
  ): AskedCommonData {
    const { settings } = this;
    const { messages, revisits } = settings.inconsistencies.in(earlier);
    return {
      id: settings.id,
      label: settings.labelFrom?.(context) ?? settings.label,
      hint: settings.hintFrom?.(context) ?? settings.hint,
      reminder: settings.reminderFrom?.(context) ?? settings.reminder,
      optional:
        settings.optional === true && !settings.requiredWhen?.in(earlier),
      under: settings.under,
      inconsistencies: messages,
      revisits,
    };
  }

  private withSettings(
    changes: Partial<CommonSettings<Questions, Cibles, Faits>>,
  ) {
    return this.rebuilt({ ...this.settings, ...changes }, this.own);
  }
}
