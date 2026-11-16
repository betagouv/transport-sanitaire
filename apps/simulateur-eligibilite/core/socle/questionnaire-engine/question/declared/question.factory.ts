// Les constructeurs des questions d'un modèle. Une question se déclare par sa
// sorte, son id et son libellé, puis réglage par réglage :
//
//   question.singleChoice("Q1.1", "Concernant son déplacement, le patient :")
//     .possibleAnswers({
//       "1_SEUL": "Peut se déplacer seul…",
//       "2_AVEC_UN_PROCHE": "…",
//     })
//     .possibleAnswer("2_AVEC_UN_PROCHE", (possibleAnswer) =>
//       possibleAnswer.description("…"),
//     )
//     .mattersWhile(given.fait("fait_situation_soins_qualifiante").isNon())
//
// Une question à choix porte ses réponses possibles : elles disent le type de
// sa réponse. Une saisie le tient de sa sorte : un nombre, un texte, une case.
//
// Les gardes et les incohérences sont des conditions (`conditions/reading.factory.ts`). Les libellés,
// rappels, aides et bornes calculés reçoivent un seul objet : les réponses, les
// questions validées, les cibles et les faits. Les faits sont ceux des
// questions validées jusque-là, calculés seulement si on les lit.

import type { Pipeline } from "../asked/context.vo.ts";
import type { AnyQuestions, ReadByObject } from "../question.ts";
import { DeclaredMultipleChoice, DeclaredSingleChoice } from "./choices.vo.ts";
import { Inconsistencies } from "./inconsistencies.vo.ts";
import {
  DeclaredAddress,
  DeclaredCheckbox,
  DeclaredDate,
  DeclaredNumber,
  DeclaredText,
} from "./inputs.vo.ts";
import { DeclaredPossibleAnswers } from "./possible-answer.vo.ts";
import type { CommonSettings } from "./settings.types.ts";

/**
 * Les constructeurs des questions d'un modèle. `faits` : son catalogue des
 * faits. `cibles` : ce qui calcule ses cibles sur ces faits. Les conditions
 * lisent les uns et les autres (`question/asked/context.vo.ts`). `Questions` :
 * ce que les rappels et les libellés calculés lisent par id. Par défaut, rien :
 * ils lisent les questions par leur objet.
 */
export class QuestionFactory<
  Questions extends AnyQuestions = ReadByObject,
  Faits = undefined,
  Cibles = undefined,
> {
  readonly #pipeline: Pipeline<Faits, Cibles>;

  constructor(model: Pipeline<Faits, Cibles> = {}) {
    this.#pipeline = { faits: model.faits, cibles: model.cibles };
  }

  singleChoice<Id extends string>(id: Id, label: string) {
    return new DeclaredSingleChoice<Questions, Cibles, Faits, never, Id>(
      this.#settings(id, label),
      { possibleAnswers: DeclaredPossibleAnswers.of({}) },
    );
  }

  multipleChoice<Id extends string>(id: Id, label: string) {
    return new DeclaredMultipleChoice<Questions, Cibles, Faits, never, Id>(
      this.#settings(id, label),
      { possibleAnswers: DeclaredPossibleAnswers.of({}), incompatible: [] },
    );
  }

  text<Id extends string>(id: Id, label: string) {
    return this.#written(id, label, "text");
  }

  longText<Id extends string>(id: Id, label: string) {
    return this.#written(id, label, "long text");
  }

  date<Id extends string>(id: Id, label: string) {
    return this.#dated(id, label, "date");
  }

  datetime<Id extends string>(id: Id, label: string) {
    return this.#dated(id, label, "datetime");
  }

  number<Id extends string>(id: Id, label: string) {
    return new DeclaredNumber<Questions, Cibles, Faits, Id>(
      this.#settings(id, label),
      {},
    );
  }

  checkbox<Id extends string>(id: Id, label: string, box?: string) {
    return new DeclaredCheckbox<Questions, Cibles, Faits, Id>(
      this.#settings(id, label),
      { box },
    );
  }

  address<Id extends string>(id: Id, label: string) {
    return new DeclaredAddress<Questions, Cibles, Faits, Id>(
      this.#settings(id, label),
      {},
    );
  }

  // Un texte, dont la sorte dit le champ.
  #written<Id extends string>(
    id: Id,
    label: string,
    kind: "text" | "long text",
  ) {
    return new DeclaredText<Questions, Cibles, Faits, Id>(
      this.#settings(id, label),
      { kind },
    );
  }

  // Une date, avec ou sans l'heure.
  #dated<Id extends string>(id: Id, label: string, kind: "date" | "datetime") {
    return new DeclaredDate<Questions, Cibles, Faits, Id>(
      this.#settings(id, label),
      { kind },
    );
  }

  // Ce qu'une question règle avant tout réglage du modèle.
  #settings(
    id: string,
    label: string,
  ): CommonSettings<Questions, Cibles, Faits> {
    return {
      id,
      label,
      pipeline: this.#pipeline,
      conditions: [],
      inconsistencies: Inconsistencies.none(),
      dependsOn: [],
    };
  }
}
