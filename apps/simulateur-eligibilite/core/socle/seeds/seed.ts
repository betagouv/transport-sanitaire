// Ce qu'est une seed : des réponses, et ce qu'on en attend.
//
// La même définition sert aux tests, qui comparent la préconisation aux
// attendus, et à l'écran des seeds, qui permet de l'ouvrir.

import type { CibleValues } from "../decision-engine/cible.ts";
import type {
  Answers,
  AnyCibles,
  AnyQuestions,
} from "../questionnaire-engine/question.ts";

export type Seed<
  Questions extends AnyQuestions = AnyQuestions,
  Cibles extends AnyCibles = AnyCibles,
> = {
  /** Identifiant stable, en kebab-case, cité par les tests et la doc. */
  readonly id: string;
  /** Libellé de l'écran des seeds : l'écran où elle s'ouvre, puis ce qu'on y voit. */
  readonly label: string;
  /** Pourquoi cette seed existe : ce qu'elle permet de voir ou de verrouiller. */
  readonly description: string;
  /**
   * Les réponses données, par identifiant de question. Ce sont elles qui disent
   * où la seed s'ouvre : incomplètes, elle s'arrête dans un questionnaire et
   * n'annonce aucun attendu.
   */
  readonly answers: Answers<Questions>;
  /**
   * La valeur attendue de ses cibles. Partiel : on n'annonce que ce qui la
   * caractérise.
   */
  readonly expected: Partial<CibleValues<Cibles>>;
};

type SeedMismatch = {
  readonly cible: string;
  readonly expected: unknown;
  readonly actual: unknown;
};

export type SeedEvaluation = {
  /** Les cibles que la préconisation calcule pour cette seed. */
  readonly cibles: AnyCibles;
  /** Attendus démentis. Une liste vide veut dire seed conforme. */
  readonly mismatches: readonly SeedMismatch[];
};

/**
 * Évalue une seed et compare ses cibles à ses attendus.
 *
 * Le calcul est passé en paramètre : une seed ne sait pas comment le modèle
 * préconise, seulement ce qu'elle en attend.
 */
export function evaluateSeed(
  preconise: (answers: Answers) => AnyCibles,
  seed: Seed,
): SeedEvaluation {
  const cibles = preconise(seed.answers);
  const mismatches = Object.entries(seed.expected)
    .map(([cible, expected]) => ({
      cible,
      expected,
      actual: cibles[cible]?.value,
    }))
    .filter(({ expected, actual }) => actual !== expected);
  return { cibles, mismatches };
}
