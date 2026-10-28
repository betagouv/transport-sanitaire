// Ce que le socle attend du métier d'un modèle : ses questions, avant et après
// le verrou, ce qui calcule la préconisation, et ses seeds. Rien ne s'y
// affiche : l'écran du modèle (`front/socle/model.ts`) s'y ajoute.
//
// Le socle déroule le parcours et ne lit aucune clé du modèle. Il transporte les
// réponses, les faits et les cibles de l'un à l'autre.

import type { Reads } from "./questionnaire-engine/condition.ts";
import type { GivenAnswers } from "./questionnaire-engine/given-answers.ts";
import {
  type Answers,
  type AnyCibles,
  type AnyQuestions,
  pagesOf,
  type QuestionnairePart,
} from "./questionnaire-engine/question.ts";
import { Questionnaire } from "./questionnaire-engine/questionnaire.ts";
import type { ValidatedAnswers } from "./questionnaire-engine/validated-answers.ts";
import type { Seed } from "./seeds/seed.ts";

/** Les faits d'un modèle : ce que ses règles reçoivent. */
export type AnyFaits = Readonly<Record<string, unknown>>;

/** Ce que la préconisation a calculé pour des réponses. */
export type Preconisation<Faits = AnyFaits, Cibles = AnyCibles> = {
  faits: Faits;
  cibles: Cibles;
};

export type CoreModel<
  Questions extends AnyQuestions = AnyQuestions,
  Faits extends AnyFaits = AnyFaits,
  Cibles extends AnyCibles = AnyCibles,
> = {
  /**
   * Ce qui calcule la préconisation : des réponses aux faits, puis aux cibles.
   * Les faits lisent aussi les questions validées : une option qui ne s'est pas
   * proposée n'a pas été refusée.
   */
  preconisation: {
    faits: (
      answers: GivenAnswers<Questions>,
      validated: ValidatedAnswers<Questions>,
    ) => Faits;
    cibles: (faits: Faits) => Cibles;
    /**
     * Ce que lit chaque fait, ceux qu'impose la décision compris
     * (`FaitCatalogue.readsWith`) : ce qu'une question change s'y lit.
     */
    reads: ReadonlyMap<string, Reads>;
  };
  /** Les parties d'avant le verrou, qui mènent au premier résultat. */
  questionnaire: readonly QuestionnairePart<Questions, undefined>[];
  /** La partie d'après le verrou, qui complète le cerfa. */
  complement: QuestionnairePart<Questions, Cibles>;
  /** Le catalogue des seeds, chargé à la demande. */
  seeds: () => Promise<readonly Seed<Questions, Cibles>[]>;
};

/**
 * La préconisation de ces réponses : leurs faits, puis leurs cibles. Seules les
 * parties d'avant le verrou la font.
 */
export function preconisationOf<
  Questions extends AnyQuestions,
  Faits extends AnyFaits,
  Cibles extends AnyCibles,
>(
  model: CoreModel<Questions, Faits, Cibles>,
  answers: Answers<Questions>,
): Preconisation<Faits, Cibles> {
  const questionnaire = new Questionnaire<Questions>(
    pagesOf(model.questionnaire),
  );
  const read = questionnaire.readWith(answers);
  const faits = model.preconisation.faits(read.answers, read.validated);
  return { faits, cibles: model.preconisation.cibles(faits) };
}
