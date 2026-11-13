// Le parcours d'un prescripteur, tel que le journal le reçoit : une
// simulation, et ses événements numérotés dans l'ordre. Un trou dans les
// numéros dit qu'un événement s'est perdu.
//
// Le parcours suit les affichages de page, les questions validées et les phases
// où il entre et qu'il quitte, une fois chacune (ADR-8). Il numérote les
// révisions du premier résultat, et fait tomber la révision courante quand une
// page de P1 ou de P2 change les réponses validées (ADR-9). Il numérote les
// versions du document R3, qui viennent de la révision courante (ADR-10). R2 et
// R3 ouvrent un affichage, où leurs boutons sont exposés, et leurs clics s'y
// rattachent (ADR-11).

import {
  ANALYTICS_VERSION,
  type AnalyticsEvent,
  type AnalyticsIntent,
  type Phase,
} from "../../../shared/analytics/analytics-event";
import {
  type Button,
  ButtonExposure,
  type Exposures,
} from "./button-exposure.entity";
import type { DocumentContent } from "./document-version.entity";
import {
  type AboutAQuestion,
  type OpenedPage,
  PageView,
} from "./page-view.entity";
import { Results } from "./results.entity";
import type { ShownResult } from "./revision.entity";

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
  /** Les réponses validées ne sont plus les mêmes après la validation. */
  readonly changed: boolean;
};

/** La validation achève l'étape : aucune page ne s'ouvre ensuite. */
export type StageEnded = null;

/** Aucune page encore ouverte. */
type NoView = null;

/** Un écran de résultat, qui ouvre un affichage sans question. */
export type ResultScreen = "R2" | "R3";

/** Les boutons exposés, et ce qui en part au journal. */
export type ExposedButtons = {
  readonly events: AnalyticsEvent[];
  readonly exposures: Exposures;
};

/** Ce qui suit un bouton exposé : son clic, ou le téléchargement réussi. */
export type Gesture = "requested" | "succeeded";

/** Où le parcours commence : le rattachement, et le chargement de la page. */
export type Entrance = Pick<
  AnalyticsEvent,
  "establishment_id" | "service_id" | "navigation"
>;

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
  readonly #results = new Results();

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
    const view = this.#open(page);
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
      ...this.#revise(view, validation.changed),
      ...this.#complete(view, validation.nextPart),
    ]);
  }

  /**
   * Le premier résultat affiché : une nouvelle révision, sauf s'il réaffiche
   * la révision courante.
   */
  displayResult(shown: ShownResult): AnalyticsEvent[] {
    return this.#recordAll(this.#results.display(shown));
  }

  /**
   * Le document R3 affiché, son PDF prêt : une nouvelle version, sauf s'il
   * montre la dernière. Sans révision courante, rien ne part.
   */
  displayDocument(content: DocumentContent): AnalyticsEvent[] {
    return this.#recordAll(this.#results.displayDocument(content));
  }

  /** Une génération ratée du document R3. Sans révision courante, rien ne part. */
  failADocument(): AnalyticsEvent[] {
    return this.#recordAll(this.#results.failADocument());
  }

  /** R2 ou R3 monté : un affichage de plus, sans question. */
  openAResultScreen(screen: ResultScreen): void {
    this.#open({
      id: screen,
      part: screen,
      first: false,
      last: false,
      questions: [],
    });
  }

  /**
   * Les boutons offerts sur l'affichage courant, chacun exposé une fois par
   * version de son objet. Sans révision courante, aucun.
   */
  exposeButtons(buttons: readonly Button[]): ExposedButtons {
    const view = this.#view;
    const shown = view && this.#results.shownOn(view.place.screen, buttons);
    if (!view || !shown) return { events: [], exposures: {} };
    const on = { ...view.place, ...shown };
    const exposures = buttons.flatMap((b) => ButtonExposure.of(b, on) ?? []);
    const fresh = view.expose(exposures.map(({ id }) => id));
    return {
      events: this.#recordAll(
        exposures
          .filter(({ id }) => fresh.includes(id))
          .map((e) => e.exposed()),
      ),
      exposures: Object.fromEntries(exposures.map((e) => [e.button, e])),
    };
  }

  /** Un clic sur un bouton exposé, ou le téléchargement qui le suit. */
  press(exposure: ButtonExposure, gesture: Gesture): AnalyticsEvent[] {
    const details = exposure[gesture]();
    return details ? this.#recordAll([details]) : [];
  }

  // ---- implémentation ----

  #open(page: OpenedPage): PageView {
    this.#views += 1;
    this.#view = new PageView(`${this.simulationId}:v${this.#views}`, page);
    return this.#view;
  }

  #enter(view: PageView): EventDetails[] {
    const { phase } = view;
    if (!phase || this.#entered.has(phase)) return [];
    this.#entered.add(phase);
    // Le complément s'ouvre depuis la révision courante.
    const revision = phase === "P3" ? this.#results.current : null;
    return [
      {
        type: "phase_entered",
        screen: phase,
        ...(revision && { revision: revision.id }),
      },
    ];
  }

  // Une page de P1 ou de P2 qui change les réponses fait tomber la révision.
  #revise(view: PageView, changed: boolean): EventDetails[] {
    const { phase } = view;
    if (!changed || (phase !== "P1" && phase !== "P2")) return [];
    return this.#results.invalidate(phase);
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
