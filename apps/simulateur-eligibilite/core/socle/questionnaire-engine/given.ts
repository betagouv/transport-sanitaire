// Les entrées des conditions d'un modèle : une réponse, un fait, une cible, le
// jour. Chacune donne une valeur qui sait ce qu'elle lit (`condition.ts`).
//
//   given.question("Q2.10").answer().is("6_APPAREILLAGE")
//   given.fait("fait_permission").isNon()
//   given.cible("cible_mode_tap_ou_tpmr").assuming("fait_p1_complete").isOui()
//   given.all({ motif: given.question("Q2.1").answer(), sens: SENS_DU_DOCUMENT })
//
// `answer()` est la seule lecture d'une réponse. Le socle la choisit selon
// l'endroit : dans une garde, les questions posées avant elle ; dans un fait,
// les questions validées (`answer-readings.ts`).

import type { Cible } from "../decision-engine/cible.ts";
import type { Fait } from "../decision-engine/fait.ts";
import {
  all,
  type Condition,
  NOTHING,
  type Reading,
  Value,
} from "./condition.ts";
import type { Box, Choice } from "./given-answers.ts";
import { LocalDateTime } from "./local-date-time.ts";
import type { AnyQuestions } from "./question.ts";
import type { ValidatedAnswer } from "./validated-answers.ts";

/** La réponse d'une question, telle que l'endroit la voit. */
class AnswerValue<Given extends Answer> extends Value<ValidatedAnswer<Given>> {
  /** La réponse de la question `id`. */
  static of<Given extends Answer>(id: string): AnswerValue<Given> {
    return new AnswerValue(
      { ...NOTHING, questions: [id] },
      (reading) => reading.answer(id) as ValidatedAnswer<Given>,
    );
  }

  /** La réponse est cette option. Sans réponse : non. */
  is(option: Choice<Given>): Condition {
    return this.compute((answer) => answer.is(option));
  }

  /** La réponse est l'une de ces options. Sans réponse : non. */
  isOneOf(...options: readonly Choice<Given>[]): Condition {
    return this.compute((answer) => answer.isOneOf(...options));
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

  /** Cette option se proposait. */
  offered(option: Choice<Given> | Box<Given>): Condition {
    return this.compute((answer) => answer.offers(option));
  }

  /** La date répondue. Sans réponse, ou mal écrite, elle est illisible. */
  toDate(): DateValue {
    const date = this.compute(({ value }) =>
      LocalDateTime.parse(typeof value === "string" ? value : undefined),
    );
    return new DateValue(date.reads, (reading) => date.in(reading));
  }
}

/** Une date lue. Illisible, toute comparaison avec elle vaut « non ». */
class DateValue extends Value<LocalDateTime> {
  /** Aujourd'hui, à minuit, à Paris. */
  static today(): DateValue {
    return new DateValue(NOTHING, (reading) => reading.today());
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
    return new DateValue(this.reads, (reading) => shift(this.in(reading)));
  }
}

/** Un fait, tel que les réponses de l'endroit le donnent. */
class FaitValue<Of extends boolean | number | string> extends Value<Fait<Of>> {
  static of<Of extends boolean | number | string>(nom: string): FaitValue<Of> {
    return new FaitValue(
      { ...NOTHING, faits: [nom] },
      (reading) => reading.fait(nom) as Fait<Of>,
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
class CibleValue<
  Of extends boolean | string,
  FaitNom extends string,
> extends Value<Cible<Of>> {
  readonly #nom: string;

  private constructor(nom: string, evaluate: (reading: Reading) => Cible<Of>) {
    super({ ...NOTHING, cibles: [nom] }, evaluate);
    this.#nom = nom;
  }

  static of<Of extends boolean | string, FaitNom extends string>(
    nom: string,
  ): CibleValue<Of, FaitNom> {
    return new CibleValue(nom, (reading) => reading.cible(nom) as Cible<Of>);
  }

  /**
   * La cible, si ce fait valait « oui ». Une garde ne suppose une partie finie
   * que pour lire une règle qui attend sa fin : le commentaire dit pourquoi.
   */
  assuming(fait: FaitNom): CibleValue<Of, FaitNom> {
    const nom = this.#nom;
    return new CibleValue(
      nom,
      (reading) => reading.cibleAssuming(nom, fait) as Cible<Of>,
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

  /** Il manque un fait pour la calculer. */
  isInconnue(): Condition {
    return this.compute((cible) => cible.isInconnue());
  }

  /** Elle ne s'applique pas à ces faits. */
  isSansObjet(): Condition {
    return this.compute((cible) => cible.isSansObjet());
  }
}

/**
 * Les entrées des conditions d'un modèle, typées par ses questions, ses faits
 * et ses cibles : `export const given = givenOf<Questions, Faits, Cibles>()`.
 */
export function givenOf<
  Questions extends AnyQuestions,
  Faits = undefined,
  Cibles = undefined,
>() {
  type FaitNom = keyof Faits & string;
  return {
    question: <Id extends keyof Questions & string>(id: Id) => ({
      answer: () => AnswerValue.of<Questions[Id]>(id),
    }),
    fait: <Nom extends FaitNom>(nom: Nom) =>
      FaitValue.of<ValueOf<Faits[Nom]>>(nom),
    cible: <Nom extends keyof Cibles & string>(nom: Nom) =>
      CibleValue.of<CibleOf<Cibles[Nom]>, FaitNom>(nom),
    all,
    today: () => DateValue.today(),
  };
}

// ---- implémentation ----

type ValueOf<Read> = Read extends Fait<infer Of> ? Of : never;
type CibleOf<Read> = Read extends Cible<infer Of> ? Of : never;
type Answer = AnyQuestions[string];
