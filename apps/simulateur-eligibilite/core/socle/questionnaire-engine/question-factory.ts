// Les constructeurs des questions d'un modèle. Une question se déclare par sa
// sorte, son id et son libellé, puis réglage par réglage :
//
//   question.singleChoice("Q1.1", "Le patient a-t-il besoin d'aide ?")
//     .option("3_AIDE_ET_SURVEILLANCE", (option) => option.description("…"))
//     .mattersWhile(given.fait("fait_situation_soins_qualifiante").isNon())
//
// L'id dit la sorte : une question à choix n'accepte que les ids du catalogue,
// un nombre que ceux dont la réponse est un nombre. Les options viennent du
// catalogue d'après l'id, et le modèle ne redit que ce qui change.
//
// Les gardes et les incohérences sont des conditions (`given.ts`). Les libellés,
// rappels, aides et bornes calculés reçoivent un seul objet : les réponses, les
// questions validées, les cibles et les faits. Les faits sont ceux des
// questions validées jusque-là, calculés seulement si on les lit.

import type { Address } from "./address.ts";
import {
  DeclaredMultipleChoice,
  DeclaredSingleChoice,
} from "./declared-choices.ts";
import {
  DeclaredAddress,
  DeclaredCheckbox,
  DeclaredDate,
  DeclaredNumber,
  DeclaredText,
} from "./declared-inputs.ts";
import { DeclaredOptions } from "./declared-option.ts";
import type { CommonSettings } from "./declared-question.ts";
import type { AnyQuestions } from "./question.ts";
import type { Pipeline } from "./question-context.ts";

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
 * `faits` et `cibles` : ce qui calcule ses faits, puis ses cibles, que les
 * conditions lisent (`question-context.ts`).
 */
export function questionsOf<
  Questions extends AnyQuestions,
  Faits = undefined,
  Cibles = undefined,
>(
  model: { readonly options: Catalogue<Questions> } & Pipeline<
    Questions,
    Faits,
    Cibles
  >,
) {
  const pipeline = { faits: model.faits, cibles: model.cibles };
  const settingsOf = settingsFor<Questions, Cibles, Faits>(pipeline);
  const optionsOf = optionsFor<Questions, Cibles, Faits>(model.options);
  return {
    singleChoice: <Id extends SingleChoiceId<Questions>>(
      id: Id,
      label: string,
    ) =>
      new DeclaredSingleChoice<
        Questions,
        Cibles,
        Faits,
        OptionOf<Questions[Id]>
      >(settingsOf(id, label), { options: optionsOf(id) }),
    multipleChoice: <Id extends MultipleChoiceId<Questions>>(
      id: Id,
      label: string,
    ) =>
      new DeclaredMultipleChoice<
        Questions,
        Cibles,
        Faits,
        OptionOf<Questions[Id]>
      >(settingsOf(id, label), { options: optionsOf(id), incompatible: [] }),
    ...inputs<Questions, Cibles, Faits>(settingsOf),
  };
}

/** La valeur d'une option : celle d'un choix unique, ou d'une case cochée. */
export type OptionOf<Given> = Given extends readonly (infer Value)[]
  ? Value & string
  : Given & string;

/** Les questions à choix unique : une réponse parmi des valeurs connues. */
export type SingleChoiceId<Questions> = {
  [Id in keyof Questions & string]: Questions[Id] extends string
    ? string extends Questions[Id]
      ? never
      : Id
    : never;
}[keyof Questions & string];

/** Les questions à choix multiple : des cases parmi des valeurs connues. */
export type MultipleChoiceId<Questions> = {
  [Id in keyof Questions &
    string]: Questions[Id] extends readonly (infer Value)[]
    ? string extends Value
      ? never
      : Id
    : never;
}[keyof Questions & string];

// ---- implémentation ----

/** Les questions dont la réponse est exactement celle de cette saisie. */
type InputId<Questions, Kind> = {
  [Id in keyof Questions & string]: [Questions[Id]] extends [AnswerOf<Kind>]
    ? [AnswerOf<Kind>] extends [Questions[Id]]
      ? Id
      : never
    : never;
}[keyof Questions & string];

// La réponse d'une saisie, par sa sorte.
type AnswerOf<Kind> = Kind extends "number"
  ? number
  : Kind extends "checkbox"
    ? boolean
    : Kind extends "address"
      ? Address
      : string;

// Ce qu'une question règle avant tout réglage du modèle.
type SettingsOf<Questions extends AnyQuestions, Cibles, Faits> = (
  id: keyof Questions & string,
  label: string,
) => CommonSettings<Questions, Cibles, Faits>;

function settingsFor<Questions extends AnyQuestions, Cibles, Faits>(
  pipeline: Pipeline<Questions, Faits, Cibles>,
): SettingsOf<Questions, Cibles, Faits> {
  return (id, label) => ({
    id,
    label,
    pipeline,
    conditions: [],
    inconsistencies: [],
    dependsOn: [],
  });
}

// Les options d'une question à choix, d'après son catalogue.
function optionsFor<Questions extends AnyQuestions, Cibles, Faits>(
  catalogue: Catalogue<Questions>,
) {
  const labels = catalogue as unknown as Readonly<
    Record<string, Readonly<Record<string, string>>>
  >;
  return (id: string) =>
    DeclaredOptions.of<Questions, Cibles, Faits>(labels[id] ?? {});
}

function inputs<Questions extends AnyQuestions, Cibles, Faits>(
  settingsOf: SettingsOf<Questions, Cibles, Faits>,
) {
  type Id<Kind> = InputId<Questions, Kind>;
  return {
    number: (id: Id<"number">, label: string) =>
      new DeclaredNumber<Questions, Cibles, Faits>(settingsOf(id, label), {}),
    text: (id: Id<"text">, label: string) =>
      new DeclaredText<Questions, Cibles, Faits>(settingsOf(id, label), {
        kind: "text",
      }),
    longText: (id: Id<"text">, label: string) =>
      new DeclaredText<Questions, Cibles, Faits>(settingsOf(id, label), {
        kind: "long text",
      }),
    date: (id: Id<"date">, label: string) =>
      new DeclaredDate<Questions, Cibles, Faits>(settingsOf(id, label), {
        kind: "date",
      }),
    datetime: (id: Id<"date">, label: string) =>
      new DeclaredDate<Questions, Cibles, Faits>(settingsOf(id, label), {
        kind: "datetime",
      }),
    checkbox: (id: Id<"checkbox">, label: string, box: string) =>
      new DeclaredCheckbox<Questions, Cibles, Faits>(settingsOf(id, label), {
        box,
      }),
    address: (id: Id<"address">, label: string) =>
      new DeclaredAddress<Questions, Cibles, Faits>(settingsOf(id, label), {}),
  };
}
