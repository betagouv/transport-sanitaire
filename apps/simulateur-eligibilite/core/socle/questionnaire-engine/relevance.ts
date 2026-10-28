// Ce qu'une question change de ce qui compte (#196, #255). Le socle ne pose une
// question que si sa réponse peut changer ce que montre le résultat, ou si une
// question qui reste se pose (D-220, D-221). Le graphe de décision le dit, sans
// dérouler les règles.
//
// Une question qui porte une incohérence compte toujours : elle bloque la suite,
// et le graphe n'en sait rien (D-222). Ce que lisent ses incohérences compte
// comme ce que lisent ses gardes. Une question déclarée `alwaysAsked` compte
// aussi toujours.
//
// Ce qui compte, c'est ce que lisent les résultats (`shown`) : sans branche,
// toujours ; dans une branche (`onBranch`), tant que sa cible peut encore
// prendre une de ses valeurs. Ex. : ce que lit la fiche positive ne compte que
// tant que l'issue peut encore être positive. S'y ajoute ce que lisent les
// gardes des questions qui restent et qui comptent : la question elle-même,
// celles qui la suivent et peuvent encore se poser (`askability.ts`, D-223),
// et celles d'avant qui attendent leur réponse.
//
// Les faits d'une question qui reste sont libres : sa réponse n'est pas encore
// donnée. Ceux qu'impose la décision aussi : le graphe ne suppose rien de la
// complétude. Les autres valent ce que donnent les questions validées avant
// elle. Le graphe restreint à ces faits ne teste plus que les faits libres : la
// question compte s'il teste un fait qu'elle change.
//
// Après le verrou, les faits et les cibles sont figés : seul compte ce qui lit
// la question telle quelle, et les gardes qui lisent ses faits.

import type {
  DecisionGraphData,
  FaitValue,
} from "../decision-engine/decision-graph.ts";
import { Askability } from "./askability.ts";
import { flattened, NOTHING, type Reads, readsOf } from "./condition.ts";
import type { AnyCibles, Page, Validated } from "./question.ts";
import {
  type Fixed,
  type Gate,
  RelevanceGraph,
  type Section,
} from "./relevance-graph.ts";
import { ValidatedAnswers } from "./validated-answers.ts";

/** Ce que la pertinence lit du modèle. */
export type RelevanceSources = {
  readonly graph: DecisionGraphData;
  /** Toutes les pages, dans l'ordre, celles d'après le verrou comprises. */
  readonly pages: readonly Page[];
  readonly faits: {
    /** Ce que lit chaque fait. */
    readonly reads: ReadonlyMap<string, Reads>;
    /** Les faits qu'impose la décision, que le graphe laisse libres. */
    readonly imposed: readonly string[];
    /** Les faits de ces questions validées, sauf ceux qu'impose la décision. */
    readonly of: (
      validated: ValidatedAnswers,
    ) => Readonly<Record<string, unknown>>;
  };
  /** Ce que lisent les résultats, branches comprises. */
  readonly shown: Reads;
};

/** Où une question se pose. */
export type RelevancePlace = {
  /** Les questions validées avant elle. */
  readonly validated: Validated;
  /** Celles d'avant elle qui se posent et attendent leur réponse. */
  readonly pending: readonly string[];
  /** Les cibles figées au verrou, après lui. */
  readonly cibles?: AnyCibles;
};

/** Ce qu'une question change de ce qui compte. */
export class Relevance {
  readonly #graph: RelevanceGraph;
  readonly #order: readonly string[];
  readonly #lock: number;
  readonly #guards: ReadonlyMap<string, Reads>;
  readonly #kept: ReadonlySet<string>;
  readonly #sections: readonly Section[];
  readonly #changes: (id: string) => ReadonlySet<string>;
  readonly #of: RelevanceSources["faits"]["of"];
  readonly #imposed: ReadonlySet<string>;
  readonly #askability: Askability;
  readonly #known = new Map<string, boolean>();

  constructor({ graph, pages, faits, shown }: RelevanceSources) {
    const questions = pages.flatMap((page) =>
      page.questions.map((question) => ({ question, page })),
    );
    this.#graph = new RelevanceGraph(graph);
    this.#order = questions.map(({ question }) => question.id);
    this.#lock = questions.findIndex(({ page }) => page.afterLock);
    this.#guards = new Map(
      questions.map(({ question }) => [
        question.id,
        flattened(
          readsOf(question.guardReads, question.inconsistencyReads ?? NOTHING),
        ),
      ]),
    );
    this.#kept = new Set(
      questions
        .filter(
          ({ question }) =>
            question.inconsistencyReads || question.isAlwaysAsked,
        )
        .map(({ question }) => question.id),
    );
    this.#sections = sectionsOf(shown, []);
    this.#imposed = new Set(faits.imposed);
    this.#changes = changedBy(faits.reads, this.#imposed);
    this.#askability = new Askability(
      questions.map(({ question }) => question),
      { reads: faits.reads, imposed: this.#imposed },
    );
    this.#of = faits.of;
  }

  /** Cette question, à cette place, peut-elle changer ce qui compte ? */
  matters(id: string, place: RelevancePlace): boolean {
    const rank = this.#order.indexOf(id);
    if (rank < 0) return true;
    const later = this.#order.slice(rank + 1);
    const alive = this.#askability.alive(id, later, place);
    const remaining = [id, ...alive, ...place.pending];
    if (this.#lock >= 0 && rank >= this.#lock) {
      return this.#counts(id, remaining, this.#afterLock(place.cibles ?? {}));
    }
    const fixed = this.#fixed(remaining, place.validated);
    const key = [id, place.pending, alive, [...fixed.values()]].join("|");
    const known = this.#known.get(key);
    if (known !== undefined) return known;
    const matters = this.#counts(id, remaining, this.#beforeLock(fixed));
    this.#known.set(key, matters);
    return matters;
  }

  // ---- implémentation ----

  // La question compte si elle porte une incohérence ou se déclare toujours
  // posée, si ce que montrent les résultats dépend d'elle, ou si elle décide
  // de la garde d'une question qui reste et qui compte elle-même (D-221).
  #counts(id: string, remaining: readonly string[], lens: Lens): boolean {
    const known = new Map<string, boolean>();
    const counts = (question: string): boolean => {
      const cached = known.get(question);
      if (cached !== undefined) return cached;
      known.set(question, false); // Une garde qui se lit en boucle ne compte pas.
      const reaches = (read: Read) =>
        read.questions.includes(question) ||
        [...this.#changes(question)].some((nom) => read.faits.has(nom));
      const result =
        this.#kept.has(question) ||
        reaches(lens.shown) ||
        remaining.some(
          (other) =>
            other !== question && reaches(lens.guard(other)) && counts(other),
        );
      known.set(question, result);
      return result;
    };
    return counts(id);
  }

  // Avant le verrou, le graphe restreint aux faits figés dit de quels faits
  // dépendent encore les résultats ouverts et les gardes.
  #beforeLock(fixed: Fixed): Lens {
    const graph = this.#graph.restrictedTo(fixed);
    const open = this.#sections.filter(({ gates }) => gates.every(graph.opens));
    const shown: Read = {
      questions: open.flatMap(({ reads }) => reads.questions),
      faits: new Set(open.flatMap((section) => [...graph.dependsOn(section)])),
    };
    const guard = (other: string): Read => {
      const reads = this.#guard(other);
      const faits = graph.dependsOn({ reads, gates: [] });
      return { questions: reads.questions, faits };
    };
    return { shown, guard: memoized(guard) };
  }

  // Après le verrou, les cibles sont figées : ce que lisent tels quels les
  // résultats qu'elles ouvrent, et les gardes.
  #afterLock(cibles: AnyCibles): Lens {
    const opens = ({ cible, values }: Gate) =>
      values.includes(
        (cibles[cible] as { value?: unknown } | undefined)?.value,
      );
    const open = this.#sections.filter(({ gates }) => gates.every(opens));
    const shown: Read = {
      questions: open.flatMap(({ reads }) => reads.questions),
      faits: new Set(),
    };
    const guard = (other: string): Read => {
      const reads = this.#guard(other);
      return { questions: reads.questions, faits: new Set(reads.faits) };
    };
    return { shown, guard: memoized(guard) };
  }

  #guard(id: string): Reads {
    return this.#guards.get(id) ?? NOTHING;
  }

  // Les faits figés : ceux des questions validées, hors des faits libres.
  #fixed(remaining: readonly string[], validated: Validated): Fixed {
    const free = new Set(this.#imposed);
    for (const id of remaining)
      for (const fait of this.#changes(id)) free.add(fait);
    const faits = this.#of(new ValidatedAnswers(validated));
    return new Map(
      this.#graph.faits.flatMap((nom, rank) =>
        free.has(nom) ? [] : [[rank, faitValue(faits[nom])] as const],
      ),
    );
  }
}

// Ce qu'une lecture voit d'une question : ce qu'elle en lit tel quel, et les
// faits dont elle dépend encore.
type Read = {
  readonly questions: readonly string[];
  readonly faits: ReadonlySet<string>;
};

// Ce que lisent les résultats, et la garde de chaque question qui reste.
type Lens = {
  readonly shown: Read;
  readonly guard: (id: string) => Read;
};

function memoized(read: (id: string) => Read): (id: string) => Read {
  const known = new Map<string, Read>();
  return (id) => {
    const cached = known.get(id) ?? read(id);
    known.set(id, cached);
    return cached;
  };
}

function sectionsOf(
  { branches = [], ...reads }: Reads,
  gates: readonly Gate[],
): Section[] {
  return [
    { reads, gates },
    ...branches.flatMap(({ cible, values, reads: inner }) =>
      sectionsOf(inner, [...gates, { cible, values }]),
    ),
  ];
}

// Pour chaque question, les faits qui la lisent, puis ceux qui les lisent, de
// proche en proche. Ceux qu'impose la décision n'y sont pas.
function changedBy(
  reads: ReadonlyMap<string, Reads>,
  imposed: ReadonlySet<string>,
): (id: string) => ReadonlySet<string> {
  const known = new Map<string, ReadonlySet<string>>();
  return (id) => {
    const cached = known.get(id);
    if (cached) return cached;
    const changed = new Set<string>();
    for (let grew = true; grew; ) {
      grew = false;
      for (const [nom, lu] of reads) {
        if (imposed.has(nom) || changed.has(nom)) continue;
        if (lu.questions.includes(id) || lu.faits.some((f) => changed.has(f))) {
          changed.add(nom);
          grew = true;
        }
      }
    }
    known.set(id, changed);
    return changed;
  };
}

function faitValue(fait: unknown): FaitValue {
  const value = (fait as { value?: unknown } | undefined)?.value;
  return typeof value === "boolean" ? value : undefined;
}
