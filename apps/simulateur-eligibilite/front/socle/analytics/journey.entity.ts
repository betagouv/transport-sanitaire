// Le parcours d'un prescripteur, tel que le journal le reçoit : une
// simulation, et ses événements numérotés dans l'ordre. Un trou dans les
// numéros dit qu'un événement s'est perdu.
//
// Le parcours suit les affichages de page, les questions validées et les phases
// où il entre et qu'il quitte, une fois chacune (ADR-8).

import {
  ANALYTICS_VERSION,
  type AnalyticsEvent,
  type AnalyticsIntent,
  type Phase,
} from "../../../shared/analytics/analytics-event";
import {
  type AboutAQuestion,
  type OpenedPage,
  PageView,
} from "./page-view.entity";

// Ce qu'un événement dit de lui-même : le parcours fait le reste.
type EventDetails = Omit<
  AnalyticsEvent,
  "event_id" | "simulation_id" | "sequence" | "occurred_at" | "version"
>;

/** Rien à garder au journal : le parcours d'une seed, ou une intention déjà connue. */
export type NothingToRecord = null;

/** Une page validée : ses questions affichées, et ce qui reste validé ensuite. */
export type PageValidation = {
  readonly questions: readonly string[];
  /** Les questions validées après la validation, celles de la page comprises. */
  readonly stillValidated: readonly string[];
  /** La partie de la page qui s'ouvre ensuite. Aucune : l'étape s'achève. */
  readonly nextPart: string | StageEnded;
};

/** La validation achève l'étape : aucune page ne s'ouvre ensuite. */
export type StageEnded = null;

/** Aucune page encore ouverte. */
type NoView = null;

/** Où le parcours commence : l'établissement et le service du rattachement. */
export type Entrance = Pick<AnalyticsEvent, "establishment_id" | "service_id">;

export class Journey {
  readonly simulationId = crypto.randomUUID();
  readonly #seeded: boolean;
  #sequence = 0;
  #intentSelected = false;
  #views = 0;
  #view: PageView | NoView = null;
  readonly #entered = new Set<Phase>();
  readonly #completed = new Set<Phase>();
  // Chaque question validée, et ce qu'en disait sa validation.
  readonly #validations = new Map<string, AboutAQuestion>();

  /**
   * `seeded` : la simulation s'ouvre sur une seed, au milieu du parcours. Elle
   * n'est pas un parcours de prescripteur : rien n'en part.
   */
  constructor({ seeded }: { seeded: boolean }) {
    this.#seeded = seeded;
  }

  /** Le début du parcours, sur P0. */
  start(entrance: Entrance): AnalyticsEvent | NothingToRecord {
    return this.#record({
      type: "simulation_started",
      screen: "P0",
      ...entrance,
    });
  }

  /**
   * L'intention du parcours : celle du premier choix validé. Un retour sur P0
   * peut changer le choix à l'écran, pas l'intention.
   */
  selectIntent(intent: AnalyticsIntent): AnalyticsEvent | NothingToRecord {
    if (this.#intentSelected) return null;
    this.#intentSelected = true;
    return this.#record({ type: "intent_selected", screen: "P0", intent });
  }

  /**
   * Un affichage de page : l'entrée dans sa phase si c'est la première fois, et
   * ses questions exposées.
   */
  openAPage(page: OpenedPage): AnalyticsEvent[] {
    this.#views += 1;
    const view = new PageView(`${this.simulationId}:v${this.#views}`, page);
    this.#view = view;
    return this.#recordAll([
      ...this.#enter(view),
      ...this.#expose(view, page.questions),
    ]);
  }

  /** Les questions affichées, après une saisie : seules les nouvelles partent. */
  showQuestions(questions: readonly string[]): AnalyticsEvent[] {
    if (!this.#view) return [];
    return this.#recordAll(this.#expose(this.#view, questions));
  }

  /** Une saisie, quand elle change de question. */
  interact(question: string): AnalyticsEvent[] {
    const view = this.#view;
    if (!view?.interact(question)) return [];
    return this.#recordAll([
      { type: "question_interacted", ...view.about(question) },
    ]);
  }

  /**
   * La page validée : chacune de ses questions, celles qui ne sont plus
   * validées, et la fin de sa phase si la page suivante la quitte.
   */
  validate(validation: PageValidation): AnalyticsEvent[] {
    const view = this.#view;
    if (!view) return [];
    const validated = validation.questions.map((question) => {
      const about = view.about(question);
      this.#validations.set(question, about);
      return { type: "question_validated" as const, ...about };
    });
    return this.#recordAll([
      ...validated,
      ...this.#invalidate(validation.stillValidated),
      ...this.#complete(view, validation.nextPart),
    ]);
  }

  #enter(view: PageView): EventDetails[] {
    const { phase } = view;
    if (!phase || this.#entered.has(phase)) return [];
    this.#entered.add(phase);
    return [{ type: "phase_entered", screen: phase }];
  }

  #expose(view: PageView, questions: readonly string[]): EventDetails[] {
    const milestones = view.milestones;
    return view.expose(questions).map((question) => ({
      type: "question_exposed",
      ...view.about(question),
      ...(milestones.length > 0 ? { milestones } : {}),
    }));
  }

  // Les validations qu'une réponse changée a fait tomber.
  #invalidate(stillValidated: readonly string[]): EventDetails[] {
    const fallen = [...this.#validations].filter(
      ([question]) => !stillValidated.includes(question),
    );
    return fallen.map(([question, about]) => {
      this.#validations.delete(question);
      return { type: "question_invalidated", ...about };
    });
  }

  #complete(view: PageView, nextPart: string | StageEnded): EventDetails[] {
    const { phase } = view;
    if (!phase || nextPart === view.part || this.#completed.has(phase))
      return [];
    this.#completed.add(phase);
    return [{ type: "phase_completed", screen: phase }];
  }

  #recordAll(details: EventDetails[]): AnalyticsEvent[] {
    return details.flatMap((each) => this.#record(each) ?? []);
  }

  // L'événement suivant du parcours, numéroté et daté.
  #record(details: EventDetails): AnalyticsEvent | NothingToRecord {
    if (this.#seeded) return null;
    this.#sequence += 1;
    return {
      event_id: `${this.simulationId}:${this.#sequence}`,
      simulation_id: this.simulationId,
      sequence: this.#sequence,
      occurred_at: new Date().toISOString(),
      version: ANALYTICS_VERSION,
      is_test: false,
      ...details,
    };
  }
}
