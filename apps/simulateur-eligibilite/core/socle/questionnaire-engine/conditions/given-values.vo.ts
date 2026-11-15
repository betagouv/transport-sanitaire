// Les valeurs que donnent les entrées des conditions (`given.ts`) : la réponse
// d'une question, le jour, un fait, une cible. Chacune sait ce qu'elle lit, et
// donne les conditions qui la comparent.

import type { Cible, Fait } from "../../decision-engine/index.ts";

import type { Box, Choice } from "../answers/given-answers.vo.ts";
import type { ValidatedAnswer } from "../answers/validated-answers.vo.ts";
import type { AnyQuestions } from "../question/question.ts";
import { type Condition, type Context, onBranch, Value } from "./condition.ts";
import { LocalDateTime } from "./local-date-time.vo.ts";
import { Reads } from "./reads.vo.ts";

/** La réponse d'une question, telle que l'endroit la voit. */
export class AnswerValue<Given extends Answer> extends Value<
  ValidatedAnswer<Given>
> {
  /** La réponse de la question `id`. */
  static of<Given extends Answer>(id: string): AnswerValue<Given> {
    return new AnswerValue(
      Reads.ofQuestion(id),
      (context) => context.answer(id) as ValidatedAnswer<Given>,
    );
  }

  /** La réponse est cette réponse possible. Sans réponse : non. */
  is(possibleAnswer: Choice<Given>): Condition {
    return this.compute((answer) => answer.is(possibleAnswer));
  }

  /** La réponse est l'une de ces réponses possibles. Sans réponse : non. */
  isOneOf(...possibleAnswers: readonly Choice<Given>[]): Condition {
    return this.compute((answer) => answer.isOneOf(...possibleAnswers));
  }

  /** La question n'a pas de réponse : pas encore, ou elle ne se pose pas. */
  isMissing(): Condition {
    return this.compute((answer) => !answer.hasAnswer());
  }

  /** La question a sa réponse. */
  isPresent(): Condition {
    return this.compute((answer) => answer.hasAnswer());
  }

  /** La question est validée : elle s'est posée, et sa réponse tient. */
  isValidated(): Condition {
    return this.compute((answer) => answer.isValidated());
  }

  /** Au moins une case est cochée. Sans réponse : non. */
  anyChecked(): Condition {
    return this.compute((answer) => answer.hasAnyChecked());
  }

  /** Cette case est cochée. Sans réponse : non. */
  checked(box: Box<Given>): Condition {
    return this.compute((answer) => answer.checked(box));
  }

  /** Cette réponse possible se proposait. */
  offered(possibleAnswer: Choice<Given> | Box<Given>): Condition {
    return this.compute((answer) => answer.offers(possibleAnswer));
  }

  /** La date répondue. Sans réponse, ou mal écrite, elle est illisible. */
  toDate(): DateValue {
    const date = this.compute(({ value }) =>
      LocalDateTime.parse(typeof value === "string" ? value : undefined),
    );
    return new DateValue(date.reads, (context) => date.in(context));
  }
}

/** Une date lue. Illisible, toute comparaison avec elle vaut « non ». */
export class DateValue extends Value<LocalDateTime> {
  /** Aujourd'hui, à minuit, à Paris. */
  static today(): DateValue {
    return new DateValue(Reads.none(), (context) => context.today());
  }

  isBefore(other: DateValue): Condition {
    return this.computeWith(other, (a, b) => a.isBefore(b));
  }

  isAfter(other: DateValue): Condition {
    return this.computeWith(other, (a, b) => a.isAfter(b));
  }

  isAtOrBefore(other: DateValue): Condition {
    return this.computeWith(other, (a, b) => a.isAtOrBefore(b));
  }

  plusDays(days: number): DateValue {
    return this.shifted((date) => date.plusDays(days));
  }

  plusHours(hours: number): DateValue {
    return this.shifted((date) => date.plusHours(hours));
  }

  startOfDay(): DateValue {
    return this.shifted((date) => date.startOfDay());
  }

  private shifted(shift: (date: LocalDateTime) => LocalDateTime): DateValue {
    return new DateValue(this.reads, (context) => shift(this.in(context)));
  }
}

/** Un fait, tel que les réponses de l'endroit le donnent. */
export class FaitValue<Of extends boolean | number | string> extends Value<
  Fait<Of>
> {
  static of<Of extends boolean | number | string>(nom: string): FaitValue<Of> {
    return new FaitValue(
      Reads.ofFait(nom),
      (context) => context.fait(nom) as Fait<Of>,
    );
  }

  isOui(): Condition {
    return this.compute(({ value }) => value === true);
  }

  isNon(): Condition {
    return this.compute(({ value }) => value === false);
  }

  isInconnu(): Condition {
    return this.compute((fait) => fait.isInconnu());
  }

  /** Le fait vaut ce nombre ou ce texte. */
  is(value: Of): Condition {
    return this.compute((fait) => fait.value === value);
  }
}

/** Une cible, telle que les règles la donnent sur les faits de l'endroit. */
export class CibleValue<
  Of extends boolean | string,
  FaitNom extends string,
> extends Value<Cible<Of>> {
  readonly #nom: string;

  private constructor(nom: string, evaluate: (context: Context) => Cible<Of>) {
    super(Reads.ofCible(nom), evaluate);
    this.#nom = nom;
  }

  static of<Of extends boolean | string, FaitNom extends string>(
    nom: string,
  ): CibleValue<Of, FaitNom> {
    return new CibleValue(nom, (context) => context.cible(nom) as Cible<Of>);
  }

  /**
   * La cible, si ce fait valait « oui ». Une garde ne suppose une partie finie
   * que pour lire une règle qui attend sa fin : le commentaire dit pourquoi.
   */
  assuming(fait: FaitNom): CibleValue<Of, FaitNom> {
    const nom = this.#nom;
    return new CibleValue(
      nom,
      (context) => context.cibleAssuming(nom, fait) as Cible<Of>,
    );
  }

  isOui(): Condition {
    return this.compute(({ value }) => value === true);
  }

  isNon(): Condition {
    return this.compute(({ value }) => value === false);
  }

  /** La cible vaut cette constante. */
  is(value: Of): Condition {
    return this.compute((cible) => cible.value === value);
  }

  /**
   * `value`, qui ne compte que quand cette cible vaut l'une de `values` : la
   * branche que choisit celui qui l'affiche (`onBranch`).
   */
  branch<Branched>(
    values: readonly Of[],
    value: Value<Branched>,
  ): Value<Branched> {
    return onBranch(this.#nom, values, value);
  }

  /** Il manque un fait pour la calculer. */
  isInconnue(): Condition {
    return this.compute((cible) => cible.isInconnue());
  }

  /** Elle ne s'applique pas à ces faits. */
  isSansObjet(): Condition {
    return this.compute((cible) => cible.isSansObjet());
  }
}

// ---- implémentation ----

type Answer = AnyQuestions[string];
