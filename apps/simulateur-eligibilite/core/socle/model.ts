// Ce que le socle attend du métier d'un modèle : ses questions, avant et après
// le verrou, ce qui calcule la préconisation, et ses seeds. Rien ne s'y
// affiche : l'écran du modèle (`front/socle/model.ts`) s'y ajoute.
//
// Le socle déroule le parcours et ne lit aucune clé du modèle. Il transporte les
// réponses, les faits et les cibles de l'un à l'autre (`simulation/`).

import type { DecisionGraphData } from "./decision-engine/index.ts";
import type { GivenAnswers } from "./questionnaire-engine/answers/given-answers.ts";
import type { ValidatedAnswers } from "./questionnaire-engine/answers/validated-answers.ts";
import type { Reads } from "./questionnaire-engine/conditions/condition.ts";
import type { Relevance } from "./questionnaire-engine/does-a-question-still-matter/matters.ts";
import type {
  AnyCibles,
  AnyQuestions,
  QuestionnairePart,
} from "./questionnaire-engine/question/question.ts";
import type { Seed } from "./simulation/seed.ts";

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
      relevance?: Relevance,
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
  /**
   * Le graphe de décision des règles (#196). Avec lui, une question dont la
   * réponse ne change rien de ce qui compte ne se pose pas (#255).
   */
  decision?: {
    graph: DecisionGraphData;
    /** Les faits qu'impose la décision : la complétude. */
    imposed: readonly (keyof Faits & string)[];
    /** Les faits de ces questions validées, sauf ceux qu'impose la décision. */
    faits: (validated: ValidatedAnswers<Questions>) => Faits;
  };
  /**
   * Ce qu'une question change de ce qui compte. L'écran du modèle la tire du
   * graphe et de ce que lisent ses résultats (`defineModel`).
   */
  relevance?: Relevance;
};
