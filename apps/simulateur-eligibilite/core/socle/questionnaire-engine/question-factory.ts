// Les constructeurs nommés des questions. Le modèle déclare une question par
// sa sorte et son id : `question.singleChoice("Q1.1", { label })`. Il ne redit
// ni sa sorte, ni ses options, qui viennent de son catalogue d'après l'id.
//
// Ses conditions et ses libellés du moment reçoivent un seul objet : les
// réponses, les questions validées, les cibles et les faits. Les faits sont
// ceux des questions validées jusque-là, calculés seulement si on les lit. Le
// constructeur traduit ces rappels vers la forme que le moteur appelle.

import type { Address } from "./address.ts";
import type { GivenAnswers } from "./given-answers.ts";
import { type Option, optionsFrom } from "./option.ts";
import type {
  AnyQuestions,
  MultipleChoice,
  Question,
  SingleChoice,
} from "./question.ts";
import {
  type Adapt,
  adapterOf,
  type QuestionContext,
} from "./question-context.ts";
import type { ValidatedAnswers } from "./validated-answers.ts";

/** Les libellés des options de chaque question à choix, par valeur. */
export type Catalogue<Questions extends AnyQuestions> = {
  readonly [Id in
    | SingleChoiceId<Questions>
    | MultipleChoiceId<Questions>]: Readonly<
    Record<OptionOf<Questions[Id]>, string>
  >;
};

/**
 * Les constructeurs des questions d'un modèle. `options` : son catalogue.
 * `faits` : ce qui calcule ses faits, que les conditions lisent.
 */
export function questionsOf<
  Questions extends AnyQuestions,
  Faits,
  Cibles = undefined,
>(model: {
  readonly options: Catalogue<Questions>;
  readonly faits: (
    answers: GivenAnswers<Questions>,
    validated: ValidatedAnswers<Questions>,
  ) => Faits;
}) {
  const adapt = adapterOf(model.faits);
  const labels = model.options as unknown as Readonly<Record<string, Labels>>;
  const labelsOf = (id: string) => labels[id] ?? {};
  return {
    singleChoice: singleChoiceOf<Questions, Cibles, Faits>(labelsOf, adapt),
    multipleChoice: multipleChoiceOf<Questions, Cibles, Faits>(labelsOf, adapt),
    ...inputs<Questions, Cibles, Faits>(adapt),
  };
}

// ---- implémentation ----

type Labels = Readonly<Record<string, string>>;

// La valeur d'une option : celle d'un choix unique, ou d'une case cochée.
type OptionOf<Given> = Given extends readonly (infer Value)[]
  ? Value & string
  : Given & string;

// Les questions à choix unique : une réponse parmi des valeurs connues.
type SingleChoiceId<Questions> = {
  [Id in keyof Questions & string]: Questions[Id] extends string
    ? string extends Questions[Id]
      ? never
      : Id
    : never;
}[keyof Questions & string];

// Les questions à choix multiple : des cases parmi des valeurs connues.
type MultipleChoiceId<Questions> = {
  [Id in keyof Questions &
    string]: Questions[Id] extends readonly (infer Value)[]
    ? string extends Value
      ? never
      : Id
    : never;
}[keyof Questions & string];

type InputKind =
  | "number"
  | "text"
  | "long text"
  | "date"
  | "datetime"
  | "checkbox"
  | "address";

// La réponse d'une saisie, par sa sorte.
type AnswerOf<Kind> = Kind extends "number"
  ? number
  : Kind extends "checkbox"
    ? boolean
    : Kind extends "address"
      ? Address
      : string;

// Les questions dont la réponse est exactement celle de cette saisie.
type InputId<Questions, Kind> = {
  [Id in keyof Questions & string]: [Questions[Id]] extends [AnswerOf<Kind>]
    ? [AnswerOf<Kind>] extends [Questions[Id]]
      ? Id
      : never
    : never;
}[keyof Questions & string];

// La question du moteur de cette sorte.
type Engine<Questions extends AnyQuestions, Cibles, Kind> =
  Question<Questions, Cibles> extends infer Each
    ? Each extends { readonly kind: infer Own }
      ? Kind extends Own
        ? Each
        : never
      : never
    : never;

// Les rappels du moteur, réécrits pour lire un contexte.
type WithContext<Declaration, Context> = {
  [Key in keyof Declaration]: Declaration[Key] extends
    | ((...args: never[]) => infer Result)
    | undefined
    ? (context: Context) => Result
    : Declaration[Key];
};

type Declared<Questions extends AnyQuestions, Cibles, Faits, Kind> = Omit<
  WithContext<
    Engine<Questions, Cibles, Kind>,
    QuestionContext<Questions, Cibles, Faits>
  >,
  "id" | "kind" | "options" | "exclusiveOption"
>;

type OptionDeclaration<
  Questions extends AnyQuestions,
  Cibles,
  Faits,
> = WithContext<
  Omit<Option<Questions, Cibles>, "value" | "label">,
  QuestionContext<Questions, Cibles, Faits>
>;

// Ce qu'une question à choix déclare de ses options.
type ChoiceDeclaration<Questions extends AnyQuestions, Cibles, Faits, Value> = {
  /** Ce qu'une option porte de plus que son libellé, par sa valeur. */
  readonly options?: Partial<
    Record<Value & string, OptionDeclaration<Questions, Cibles, Faits>>
  >;
  /** Les options proposées, dans cet ordre. Absente : tout le catalogue. */
  readonly order?: readonly Value[];
};

function singleChoiceOf<Questions extends AnyQuestions, Cibles, Faits>(
  labelsOf: (id: string) => Labels,
  adapt: Adapt,
) {
  return <Id extends SingleChoiceId<Questions>>(
    id: Id,
    declared: Declared<Questions, Cibles, Faits, "single choice"> &
      ChoiceDeclaration<Questions, Cibles, Faits, OptionOf<Questions[Id]>>,
  ): SingleChoice<Questions, Cibles> => {
    const { options: _, order: __, ...rest } = declared;
    const { offered } = optionsOf(labelsOf(id), declared, adapt);
    return {
      ...adapt(rest),
      id,
      kind: "single choice",
      options: offered,
    } as unknown as SingleChoice<Questions, Cibles>;
  };
}

function multipleChoiceOf<Questions extends AnyQuestions, Cibles, Faits>(
  labelsOf: (id: string) => Labels,
  adapt: Adapt,
) {
  return <Id extends MultipleChoiceId<Questions>>(
    id: Id,
    declared: Declared<Questions, Cibles, Faits, "multiple choice"> &
      ChoiceDeclaration<Questions, Cibles, Faits, OptionOf<Questions[Id]>> & {
        /** L'option qui décoche les autres : « Aucune », souvent. */
        readonly exclusiveOption?: OptionOf<Questions[Id]>;
      },
  ): MultipleChoice<Questions, Cibles> => {
    const { options: _, order: __, exclusiveOption: ___, ...rest } = declared;
    const { offered, exclusive } = optionsOf(labelsOf(id), declared, adapt);
    return {
      ...adapt(rest),
      id,
      kind: "multiple choice",
      options: offered,
      ...(exclusive && { exclusiveOption: exclusive }),
    } as unknown as MultipleChoice<Questions, Cibles>;
  };
}

// Les options du catalogue, avec ce que la déclaration leur ajoute, dans son
// ordre. L'option exclusive est mise à part.
function optionsOf(
  labels: Labels,
  declared: {
    readonly options?: Readonly<Record<string, object | undefined>>;
    readonly order?: readonly string[];
    readonly exclusiveOption?: string;
  },
  adapt: Adapt,
): { offered: Option[]; exclusive?: Option } {
  const details = Object.fromEntries(
    Object.entries(declared.options ?? {}).map(([value, option]) => [
      value,
      adapt(option ?? {}),
    ]),
  );
  const byValue = new Map(
    optionsFrom(labels, details).map((option) => [option.value, option]),
  );
  const order = declared.order ?? [...byValue.keys()];
  const exclusive = declared.exclusiveOption;
  return {
    offered: order
      .filter((value) => value !== exclusive)
      .flatMap((value) => byValue.get(value) ?? []),
    ...(exclusive !== undefined && { exclusive: byValue.get(exclusive) }),
  };
}

function inputs<Questions extends AnyQuestions, Cibles, Faits>(adapt: Adapt) {
  const of =
    <Kind extends InputKind>(kind: Kind) =>
    <Id extends InputId<Questions, Kind>>(
      id: Id,
      declared: Declared<Questions, Cibles, Faits, Kind>,
    ): Engine<Questions, Cibles, Kind> =>
      ({ ...adapt(declared), id, kind }) as unknown as Engine<
        Questions,
        Cibles,
        Kind
      >;
  return {
    number: of("number"),
    text: of("text"),
    longText: of("long text"),
    date: of("date"),
    datetime: of("datetime"),
    checkbox: of("checkbox"),
    address: of("address"),
  };
}
