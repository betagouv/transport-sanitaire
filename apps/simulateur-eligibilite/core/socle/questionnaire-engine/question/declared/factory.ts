// Les constructeurs des questions d'un modèle. Une question se déclare par sa
// sorte, son id et son libellé, puis réglage par réglage :
//
//   question.singleChoice("Q1.1", "Concernant son déplacement, le patient :")
//     .options({ "1_SEUL": "Peut se déplacer seul…", "2_AVEC_UN_PROCHE": "…" })
//     .option("2_AVEC_UN_PROCHE", (option) => option.description("…"))
//     .mattersWhile(given.fait("fait_situation_soins_qualifiante").isNon())
//
// Une question à choix porte ses options : elles disent le type de sa réponse.
// Une saisie le tient de sa sorte : un nombre, un texte, une case.
//
// Les gardes et les incohérences sont des conditions (`given.ts`). Les libellés,
// rappels, aides et bornes calculés reçoivent un seul objet : les réponses, les
// questions validées, les cibles et les faits. Les faits sont ceux des
// questions validées jusque-là, calculés seulement si on les lit.

import type { Pipeline } from "../asked/context.ts";
import type { AnyQuestions, ReadByObject } from "../question.ts";
import { DeclaredMultipleChoice, DeclaredSingleChoice } from "./choices.ts";
import {
  DeclaredAddress,
  DeclaredCheckbox,
  DeclaredDate,
  DeclaredNumber,
  DeclaredText,
} from "./inputs.ts";
import { DeclaredOptions } from "./option.ts";
import type { CommonSettings } from "./settings.ts";

/**
 * Les constructeurs des questions d'un modèle. `faits` : son catalogue des
 * faits. `cibles` : ce qui calcule ses cibles sur ces faits. Les conditions
 * lisent les uns et les autres (`question/asked/context.ts`). `Questions` :
 * ce que les rappels et les libellés calculés lisent par id. Par défaut, rien :
 * ils lisent les questions par leur objet.
 */
export function questionsOf<
  Questions extends AnyQuestions = ReadByObject,
  Faits = undefined,
  Cibles = undefined,
>(model: Pipeline<Faits, Cibles> = {}) {
  const pipeline = { faits: model.faits, cibles: model.cibles };
  const settingsOf = settingsFor<Cibles, Faits>(pipeline);
  return {
    singleChoice: <Id extends string>(id: Id, label: string) =>
      new DeclaredSingleChoice<Questions, Cibles, Faits, never, Id>(
        settingsOf(id, label),
        { options: DeclaredOptions.of({}) },
      ),
    multipleChoice: <Id extends string>(id: Id, label: string) =>
      new DeclaredMultipleChoice<Questions, Cibles, Faits, never, Id>(
        settingsOf(id, label),
        { options: DeclaredOptions.of({}), incompatible: [] },
      ),
    ...inputs<Questions, Cibles, Faits>(settingsOf),
  };
}

// ---- implémentation ----

// Ce qu'une question règle avant tout réglage du modèle.
type SettingsOf<Cibles, Faits> = <Questions extends AnyQuestions>(
  id: string,
  label: string,
) => CommonSettings<Questions, Cibles, Faits>;

function settingsFor<Cibles, Faits>(
  pipeline: Pipeline<Faits, Cibles>,
): SettingsOf<Cibles, Faits> {
  return (id, label) => ({
    id,
    label,
    pipeline,
    conditions: [],
    inconsistencies: [],
    dependsOn: [],
  });
}

function inputs<Questions extends AnyQuestions, Cibles, Faits>(
  settingsOf: SettingsOf<Cibles, Faits>,
) {
  const settings = (id: string, label: string) =>
    settingsOf<Questions>(id, label);
  return {
    ...written<Questions, Cibles, Faits>(settings),
    number: <Id extends string>(id: Id, label: string) =>
      new DeclaredNumber<Questions, Cibles, Faits, Id>(settings(id, label), {}),
    checkbox: <Id extends string>(id: Id, label: string, box?: string) =>
      new DeclaredCheckbox<Questions, Cibles, Faits, Id>(settings(id, label), {
        box,
      }),
    address: <Id extends string>(id: Id, label: string) =>
      new DeclaredAddress<Questions, Cibles, Faits, Id>(
        settings(id, label),
        {},
      ),
  };
}

// Les saisies écrites, un texte ou une date, dont la sorte dit le champ.
function written<Questions extends AnyQuestions, Cibles, Faits>(
  settings: (
    id: string,
    label: string,
  ) => CommonSettings<Questions, Cibles, Faits>,
) {
  return {
    text: <Id extends string>(id: Id, label: string) =>
      new DeclaredText<Questions, Cibles, Faits, Id>(settings(id, label), {
        kind: "text",
      }),
    longText: <Id extends string>(id: Id, label: string) =>
      new DeclaredText<Questions, Cibles, Faits, Id>(settings(id, label), {
        kind: "long text",
      }),
    date: <Id extends string>(id: Id, label: string) =>
      new DeclaredDate<Questions, Cibles, Faits, Id>(settings(id, label), {
        kind: "date",
      }),
    datetime: <Id extends string>(id: Id, label: string) =>
      new DeclaredDate<Questions, Cibles, Faits, Id>(settings(id, label), {
        kind: "datetime",
      }),
  };
}
