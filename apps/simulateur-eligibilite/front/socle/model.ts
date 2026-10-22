// Ce que le socle attend d'une version du modèle : ses questions, ce qui
// calcule la préconisation, et ses deux résultats.
//
// Le socle déroule le parcours et ne lit aucune clé du modèle. Il transporte les
// réponses, les faits et les cibles de l'un à l'autre.

import type { ComponentType, ReactNode } from "react";
import type { BoundCerfa } from "./cerfa-mapping";
import { validatedAnswers } from "./questionnaire-engine/asked-questions";
import { GivenAnswers } from "./questionnaire-engine/given-answers";
import {
  type Answers,
  type AnyCibles,
  type AnyQuestions,
  type Page,
  pagesOf,
  type QuestionnairePart,
} from "./questionnaire-engine/question";
import type { ValidatedAnswers } from "./questionnaire-engine/validated-answers";
import type { Seed } from "./seeds/seed";

/** Les faits d'un modèle : ce que ses règles reçoivent. */
export type AnyFaits = Readonly<Record<string, unknown>>;

/** Ce que la préconisation a calculé pour des réponses. */
export type Preconisation = { faits: AnyFaits; cibles: AnyCibles };

/**
 * Ce que le modèle lit des réponses : chacune telle qu'elle est donnée, et les
 * questions validées, avec ce qui s'y proposait.
 */
export type Reading<Questions extends AnyQuestions = AnyQuestions> = {
  answers: GivenAnswers<Questions>;
  validated: ValidatedAnswers<Questions>;
};

/** Ce qu'un résultat reçoit pour s'afficher. */
type ResultatProps<
  Questions extends AnyQuestions,
  Cibles,
> = Reading<Questions> & {
  cibles: Cibles;
};

/**
 * Ce que le premier résultat donne au socle, qui compose la page : le `h1`,
 * une introduction, puis le corps, et la feuille à remettre au patient s'il en
 * a une. Les boutons sont au socle : sous le corps, ou au-dessus de la feuille.
 */
export type FirstResult = {
  title: string;
  intro?: ReactNode;
  body?: ReactNode;
  sheet?: Sheet;
};

/**
 * La feuille à remettre au patient, que le socle pose sur une A4 sous les
 * logos : son titre, sa phrase d'introduction, puis son contenu.
 */
export type Sheet = { title: string; intro?: ReactNode; body: ReactNode };

/**
 * Ce que le mapping du cerfa lit : tout ce que le simulateur sait. Les
 * réponses, les faits et les cibles figés au verrou, et la date de complétion.
 */
export type CerfaInput<
  Questions extends AnyQuestions = AnyQuestions,
  Faits extends AnyFaits = AnyFaits,
  Cibles = AnyCibles,
> = ResultatProps<Questions, Cibles> & { faits: Faits; completedAt: Date };

export type Model<
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
  };
  /** Le premier résultat, après ses parties : transport et éligibilité. */
  transportAndEligibility: {
    parts: readonly QuestionnairePart<Questions, undefined>[];
    /** Le titre du stepper, au-dessus du `h1` que le résultat donne. */
    title: string;
    /**
     * Le résultat de ces réponses. Une promesse quand il charge ses textes :
     * elle ne rejette pas, un échec de chargement est un résultat comme un
     * autre.
     */
    result: (
      props: ResultatProps<Questions, Cibles>,
    ) => FirstResult | Promise<FirstResult>;
  };
  /** Le second résultat, après le verrou : le cerfa. */
  cerfa: {
    part: QuestionnairePart<Questions, Cibles>;
    /** Le cerfa de cette préconisation. `null` : rien ne suit le premier résultat. */
    form: (
      cibles: Cibles,
    ) => BoundCerfa<CerfaInput<Questions, Faits, Cibles>> | null;
    title: string;
    Resultat: ComponentType<ResultatProps<Questions, Cibles>>;
    /**
     * Le libellé de l'action qui verrouille. `null` : cette préconisation ne
     * complète rien, le bouton n'est pas posé. Il ne l'est pas non plus tant que
     * la partie n'a ni page ni cerfa : le verrou n'ouvre pas un écran vide.
     */
    startLabel: (cibles: Cibles) => string | null;
    downloadLabel: string;
  };
  /** Le catalogue des seeds, chargé à la demande. */
  seeds: () => Promise<readonly Seed<Questions, Cibles>[]>;
};

/**
 * Vérifie un modèle contre ses propres types, puis le rend tel que le socle le
 * voit : sans nom de question, de fait ni de cible.
 */
export function defineModel<
  Questions extends AnyQuestions,
  Faits extends AnyFaits,
  Cibles extends AnyCibles,
>(model: Model<Questions, Faits, Cibles>): Model {
  // Le socle ne lit aucune clé : il rend au modèle ce que le modèle lui a
  // donné. L'effacement des types est donc sans risque, et il n'a lieu qu'ici.
  return model as unknown as Model;
}

/**
 * La préconisation de ces réponses : leurs faits, puis leurs cibles. Seules les
 * parties d'avant le verrou la font.
 */
export function preconisationOf(model: Model, answers: Answers): Preconisation {
  const pages = pagesOf(model.transportAndEligibility.parts);
  const read = readingOf(pages, answers);
  const faits = model.preconisation.faits(read.answers, read.validated);
  return { faits, cibles: model.preconisation.cibles(faits) };
}

/**
 * Ces réponses, telles que le modèle les lit. `pages` : celles dont les
 * questions validées comptent. Après le verrou, les cibles figées.
 */
export function readingOf<Questions extends AnyQuestions>(
  pages: readonly Page[],
  answers: Answers<Questions>,
  cibles?: AnyCibles,
): Reading<Questions> {
  return {
    answers: new GivenAnswers(answers),
    validated: validatedAnswers(pages, answers, cibles),
  };
}
