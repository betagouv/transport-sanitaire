// Les questions qui restent et qui peuvent encore se poser (#255, D-223). Une
// question qui ne peut plus se poser ne compte pas : sa garde ne la laissera
// jamais passer, et ce qu'elle lit ne change rien.
//
// Le socle ne la dit morte que quand sa garde est jouée d'avance : tout ce
// qu'elle lit est déjà répondu, ou mort, et elle ne tient pas. Au moindre
// doute, la question reste vivante : une garde qui lit une question encore
// ouverte, un fait qu'impose la décision, ou une cible avant le verrou. Ex. :
// pour une consultation, Q2.1.g est morte, donc Q2.5, donc Q2.6.a, donc Q2.6.
//
// Une garde ne lit que des questions d'avant la sienne : un seul passage dans
// l'ordre suffit. Une question morte garde sa réponse absente (COR-02), et sa
// garde se lit ici comme le questionnaire la lira.
//
// Une question à plusieurs places est vivante tant qu'une de ses places l'est
// (ADR-29).

import { GivenAnswers } from "../answers/given-answers.ts";
import { ValidatedAnswers } from "../answers/validated-answers.ts";
import { flattened, type Reads } from "../conditions/condition.ts";
import { validatedReading } from "../conditions/what-a-condition-sees.ts";
import type { SeenAnswers } from "../question/asked/context.ts";
import type { AnyCibles, Question, Validated } from "../question/question.ts";

/** Ce que lit une question pour dire si les questions qui restent se posent. */
export type AskabilityPlace = {
  readonly validated: Validated;
  /** Celles d'avant qui se posent et attendent leur réponse. */
  readonly pending: readonly string[];
  /** Les cibles figées au verrou, après lui. */
  readonly cibles?: AnyCibles;
};

/** Ce que la garde d'une question lit, ramené aux questions. */
type Sources = {
  readonly questions: readonly string[];
  readonly cibles: readonly string[];
};

/** Si les questions qui restent peuvent encore se poser. */
export class Askability {
  readonly #places: ReadonlyMap<string, readonly Place[]>;
  readonly #known = new Map<string, boolean>();

  constructor(
    questions: readonly Question[],
    faits: {
      readonly reads: ReadonlyMap<string, Reads>;
      readonly imposed: ReadonlySet<string>;
    },
  ) {
    const sourcesOf = faitSources(faits.reads, faits.imposed);
    const places = new Map<string, Place[]>();
    for (const question of questions) {
      const sources = sourcesOf(flattened(question.conditionReads));
      const others = places.get(question.id) ?? [];
      places.set(question.id, [...others, { question, sources }]);
    }
    this.#places = places;
  }

  /**
   * Celles de `later` qui peuvent encore se poser. Restent ouvertes `id` et
   * celles d'avant qui attendent leur réponse (`pending`). Une question d'avant
   * qui ne s'est pas posée est réglée : sa réponse reste absente.
   */
  alive(
    id: string,
    later: readonly string[],
    place: AskabilityPlace,
  ): readonly string[] {
    const open = new Set([id, ...place.pending, ...later]);
    for (const other of later) {
      if (this.#isDead(other, open, place)) open.delete(other);
    }
    return later.filter((other) => open.has(other));
  }

  // ---- implémentation ----

  // Morte à toutes ses places. Une question inconnue reste vivante.
  #isDead(
    other: string,
    open: ReadonlySet<string>,
    place: AskabilityPlace,
  ): boolean {
    const places = this.#places.get(other) ?? [];
    return (
      places.length > 0 &&
      places.every((each, rank) => this.#isDeadAt(each, rank, open, place))
    );
  }

  #isDeadAt(
    { question, sources }: Place,
    rank: number,
    open: ReadonlySet<string>,
    { validated, cibles }: AskabilityPlace,
  ): boolean {
    if (!sources || (sources.cibles.length > 0 && !cibles)) return false;
    if (sources.questions.some((q) => open.has(q))) return false;
    const read = sources.questions.map((q) => validated[q] ?? null);
    const frozen = sources.cibles.map((c) => cibles?.[c]?.value);
    const key = JSON.stringify([question.id, rank, read, frozen]);
    const known = this.#known.get(key);
    if (known !== undefined) return known;
    const isDead = !asks(question, validated, cibles);
    this.#known.set(key, isDead);
    return isDead;
  }
}

// Une place de la question, et ce que lit sa garde. `null` : elle lit un
// fait qu'impose la décision, ou qu'aucune lecture ne déclare.
type Place = { readonly question: Question; readonly sources: Sources | null };

// La question se pose-t-elle sur ces seules réponses validées ?
function asks(
  question: Question,
  validated: Validated,
  cibles?: AnyCibles,
): boolean {
  const read = new ValidatedAnswers(validated);
  const answers = Object.fromEntries(
    Object.entries(validated).map(([q, entry]) => [q, entry?.answer]),
  );
  const seen: SeenAnswers = {
    answers: new GivenAnswers(answers),
    cibles,
    validated: read,
    answer: validatedReading(read),
  };
  return question.askedIn(seen, seen) !== undefined;
}

// Les questions et les cibles que lit une garde, ses faits ramenés aux
// questions qu'ils lisent. `null` : elle lit un fait qu'impose la décision, ou
// qu'aucune lecture ne déclare.
function faitSources(
  reads: ReadonlyMap<string, Reads>,
  imposed: ReadonlySet<string>,
): (guard: Reads) => Sources | null {
  return (guard) => {
    const questions = new Set(guard.questions);
    const seen = new Set<string>();
    const pending = [...guard.faits];
    for (let nom = pending.pop(); nom !== undefined; nom = pending.pop()) {
      if (seen.has(nom)) continue;
      seen.add(nom);
      const lu = reads.get(nom);
      if (imposed.has(nom) || !lu) return null;
      for (const q of lu.questions) questions.add(q);
      pending.push(...lu.faits);
    }
    return { questions: [...questions], cibles: guard.cibles };
  };
}
