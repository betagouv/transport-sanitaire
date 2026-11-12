// Les entrées des conditions d'un modèle : une réponse, un fait, une cible, le
// jour. Chacune donne une valeur qui sait ce qu'elle lit (`condition.ts`).
//
//   given.question(Q2_10).answer().is("6_APPAREILLAGE")
//   given.question("Q2.10").answer().is("6_APPAREILLAGE")
//   given.fait("fait_permission").isNon()
//   given.cible("cible_mode_tap_ou_tpmr").assuming("fait_p1_complete").isOui()
//   given.all({ motif: given.question("Q2.1").answer(), sens: SENS_CHOISI })
//
// Une question se lit par son objet, ou par son id quand le modèle type ses
// ids : une déclaration lit les questions d'avant elle par leur objet
// (`ReadByObject`), un fait ou un test par leur id.
//
// `answer()` est la seule lecture d'une réponse. Le socle la choisit selon
// l'endroit : dans une garde, les questions posées avant elle ; dans un fait,
// les questions validées (`conditions/what-a-condition-sees.ts`).

import type { Cible, Fait } from "../../decision-engine/index.ts";

import type { Box, Choice } from "../answers/given-answers.ts";
import type { ValidatedAnswer } from "../answers/validated-answers.ts";
import {
  type AnswerOfRef,
  type AnyQuestions,
  idOf,
  type QuestionRef,
} from "../question/question.ts";
import {
  all,
  type Condition,
  NOTHING,
  onBranch,
  type Scope,
  Value,
} from "./condition.ts";
import { LocalDateTime } from "./local-date-time.ts";

/** La réponse d'une question, telle que l'endroit la voit. */
class AnswerValue<Given extends Answer> extends Value<ValidatedAnswer<Given>> {
  /** La réponse de la question `id`. */
  static of<Given extends Answer>(id: string): AnswerValue<Given> {
    return new AnswerValue(
      { ...NOTHING, questions: [id] },
      (scope) => scope.answer(id) as ValidatedAnswer<Given>,
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
    return new DateValue(date.reads, (scope) => date.in(scope));
  }
}

/** Une date lue. Illisible, toute comparaison avec elle vaut « non ». */
class DateValue extends Value<LocalDateTime> {
  /** Aujourd'hui, à minuit, à Paris. */
  static today(): DateValue {
    return new DateValue(NOTHING, (scope) => scope.today());
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
    return new DateValue(this.reads, (scope) => shift(this.in(scope)));
  }
}

/** Un fait, tel que les réponses de l'endroit le donnent. */
class FaitValue<Of extends boolean | number | string> extends Value<Fait<Of>> {
  static of<Of extends boolean | number | string>(nom: string): FaitValue<Of> {
    return new FaitValue(
      { ...NOTHING, faits: [nom] },
      (scope) => scope.fait(nom) as Fait<Of>,
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

  private constructor(nom: string, evaluate: (scope: Scope) => Cible<Of>) {
    super({ ...NOTHING, cibles: [nom] }, evaluate);
    this.#nom = nom;
  }

  static of<Of extends boolean | string, FaitNom extends string>(
    nom: string,
  ): CibleValue<Of, FaitNom> {
    return new CibleValue(nom, (scope) => scope.cible(nom) as Cible<Of>);
  }

  /**
   * La cible, si ce fait valait « oui ». Une garde ne suppose une partie finie
   * que pour lire une règle qui attend sa fin : le commentaire dit pourquoi.
   */
  assuming(fait: FaitNom): CibleValue<Of, FaitNom> {
    const nom = this.#nom;
    return new CibleValue(
      nom,
      (scope) => scope.cibleAssuming(nom, fait) as Cible<Of>,
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

/**
 * Les entrées des conditions d'un modèle, typées par ses questions, ses faits
 * et ses cibles : `export const given = givenOf<Questions, Faits, Cibles>()`.
 * Avec `ReadByObject`, une question ne se lit que par son objet.
 */
export function givenOf<
  Questions extends AnyQuestions,
  Faits = undefined,
  Cibles = undefined,
>() {
  type FaitNom = keyof Faits & string;
  return {
    question: <Ref extends QuestionRef<Questions>>(question: Ref) => ({
      answer: () => AnswerValue.of<AnswerOfRef<Questions, Ref>>(idOf(question)),
    }),
    fait: <Nom extends FaitNom>(nom: Nom) =>
      FaitValue.of<FaitValueOf<Faits[Nom]>>(nom),
    cible: <Nom extends keyof Cibles & string>(nom: Nom) =>
      CibleValue.of<CibleOf<Cibles[Nom]>, FaitNom>(nom),
    /** Ces faits, sous leur nom : ce qu'un texte en lit, et rien d'autre. */
    faits: <Nom extends FaitNom>(...noms: Nom[]) =>
      named<Pick<Faits, Nom>>(noms, "faits", (scope, nom) => scope.fait(nom)),
    /** Ces cibles, sous leur nom : ce qu'un texte en lit, et rien d'autre. */
    cibles: <Nom extends keyof Cibles & string>(...noms: Nom[]) =>
      named<Pick<Cibles, Nom>>(noms, "cibles", (scope, nom) =>
        scope.cible(nom),
      ),
    all,
    today: () => DateValue.today(),
  };
}

// ---- implémentation ----

// Des faits ou des cibles, chacun sous son nom.
function named<Of>(
  noms: readonly string[],
  kind: "faits" | "cibles",
  read: (scope: Scope, nom: string) => unknown,
): Value<Of> {
  return new Value(
    { ...NOTHING, [kind]: noms },
    (scope) =>
      Object.fromEntries(noms.map((nom) => [nom, read(scope, nom)])) as Of,
  );
}

type FaitValueOf<Read> = Read extends Fait<infer Of> ? Of : never;
type CibleOf<Read> = Read extends Cible<infer Of> ? Of : never;
type Answer = AnyQuestions[string];
