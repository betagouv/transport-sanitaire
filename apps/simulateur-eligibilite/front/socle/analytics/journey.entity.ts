// Le parcours d'un prescripteur, tel que le journal le reçoit : une
// simulation, et ses événements (`EventSequence`), jusqu'à sa fermeture.
//
// Le parcours suit les affichages de page, les questions validées, les phases
// où il entre et qu'il quitte, une fois chacune, et leurs limites affichées
// (ADR-0044). Il numérote les
// révisions du premier résultat, et fait tomber la révision courante quand une
// page de P1 ou de P2 change les réponses validées (ADR-0045). Il numérote les
// versions du document R3, qui viennent de la révision courante (ADR-0046). R2 et
// R3 ouvrent un affichage, où leurs boutons sont exposés tant qu'ils y restent,
// et leurs clics s'y rattachent (ADR-0047).

import type {
  AnalyticsEvent,
  AnalyticsIntent,
  ClosureReason,
  EventDetails,
  Phase,
  Provenance,
} from "../../../shared/analytics/analytics-event";
import type { Button, ExposedOn } from "./button-place.vo";
import type { DocumentContent } from "./document-version.entity";
import { EventSequence, type NothingToRecord } from "./event-sequence.entity";
import { ExposedButtons, type NotShown } from "./exposed-buttons.entity";
import { type OpenedPage, PageView } from "./page-view.entity";
import { PhaseBoundaries } from "./phase-boundaries.entity";
import { Results } from "./results.entity";
import type { DocumentRequest, ShownResult } from "./revision.entity";

/** Une page validée : ses questions affichées, et ce qui s'ouvre ensuite. */
export type PageValidation = {
  readonly questions: readonly string[];
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

export class Journey {
  readonly #events: EventSequence;
  #intentSelected = false;
  #views = 0;
  #view: PageView | NoView = null;
  readonly #entered = new Set<Phase>();
  readonly #completed = new Set<Phase>();
  readonly #boundaries = new PhaseBoundaries();
  readonly #results = new Results();
  readonly #buttons: ExposedButtons;

  /**
   * `seeded` : la simulation s'ouvre sur une seed, au milieu du parcours. Elle
   * n'est pas un parcours de prescripteur : rien n'en part. `provenance` :
   * l'app qui le produit et son rattachement, sur chaque événement (ADR-0050,
   * ADR-0053).
   */
  constructor(opening: { seeded: boolean; provenance: Provenance }) {
    this.#events = new EventSequence(opening);
    this.#buttons = new ExposedButtons(this.simulationId);
  }

  get simulationId(): string {
    return this.#events.simulationId;
  }

  /** Le début du parcours, sur P0. */
  start(): AnalyticsEvent | NothingToRecord {
    return this.#events.record({ type: "simulation_started", screen: "P0" });
  }

  /** La fin du parcours : rien ne part plus ensuite. */
  close(reason: ClosureReason): AnalyticsEvent | NothingToRecord {
    return this.#events.close(reason);
  }

  /**
   * L'intention du parcours : celle du premier choix validé. Un retour sur P0
   * peut changer le choix à l'écran, pas l'intention.
   */
  selectIntent(intent: AnalyticsIntent): AnalyticsEvent | NothingToRecord {
    if (this.#intentSelected) return null;
    this.#intentSelected = true;
    return this.#events.record({
      type: "intent_selected",
      screen: "P0",
      intent,
    });
  }

  /**
   * Un affichage de page : l'entrée dans sa phase si c'est la première fois,
   * les limites de la phase qu'il montre, et ses questions exposées.
   */
  openAPage(page: OpenedPage): AnalyticsEvent[] {
    const view = this.#open(page);
    return this.#recordAll([
      ...this.#enter(view),
      ...this.#boundaries.display(view),
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
   * La page validée : chacune de ses questions, et la fin de sa phase si la
   * page suivante la quitte.
   */
  validate(validation: PageValidation): AnalyticsEvent[] {
    const view = this.#view;
    if (!view) return [];
    const validated = validation.questions.map((question) => ({
      type: "question_validated" as const,
      ...view.about(question),
    }));
    return this.#recordAll([
      ...validated,
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
   * Les boutons offerts sur l'affichage courant : chacun exposé tant qu'il y
   * reste sur le même objet. Sans révision courante, aucun.
   */
  exposeButtons(buttons: readonly Button[]): AnalyticsEvent[] {
    const on = this.#shownOn(buttons);
    return on ? this.#recordAll(this.#buttons.expose(buttons, on)) : [];
  }

  /** Les boutons d'un écran ne sont plus affichés : leurs clics ne partent plus. */
  withdrawButtons(screen: ResultScreen): void {
    this.#buttons.withdraw(screen);
  }

  /** Un clic, sur le bouton exposé là où l'écran le montre encore. */
  click(button: Button): AnalyticsEvent[] {
    return this.#recordAll(
      this.#buttons.click(button, this.#shownOn([button])),
    );
  }

  /** L'impression ou le téléchargement du document, que l'app lance. */
  requestDocument(request: DocumentRequest): AnalyticsEvent[] {
    const gesture = `document_${request}_requested` as const;
    return this.#recordAll(this.#results.handleTheDocument(gesture));
  }

  /** Le PDF du document remis au navigateur. */
  deliverDocument(): AnalyticsEvent[] {
    const gesture = "document_download_succeeded";
    return this.#recordAll(this.#results.handleTheDocument(gesture));
  }

  // ---- implémentation ----

  // Un affichage remplace le précédent, et ses boutons.
  #open(page: OpenedPage): PageView {
    this.#buttons.withdraw();
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

  // Une page de P1 ou de P2 qui change les réponses fait tomber la révision ;
  // une page de P3, le document (R13).
  #revise(view: PageView, changed: boolean): EventDetails[] {
    const { phase } = view;
    if (!changed || !phase) return [];
    if (phase === "P3") return this.#results.invalidateTheDocument();
    return this.#results.invalidate(phase);
  }

  #expose(view: PageView, questions: readonly string[]): EventDetails[] {
    return view.expose(questions).map((question) => ({
      type: "question_exposed",
      ...view.about(question),
    }));
  }

  #complete(view: PageView, nextPart: string | StageEnded): EventDetails[] {
    const { phase } = view;
    if (!phase || nextPart === view.part || this.#completed.has(phase))
      return [];
    this.#completed.add(phase);
    return [{ type: "phase_completed", screen: phase }];
  }

  // Ce que montre l'affichage courant, où ces boutons sont offerts.
  #shownOn(buttons: readonly Button[]): ExposedOn | NotShown {
    const view = this.#view;
    const shown = view && this.#results.shownOn(view.place.screen, buttons);
    return view && shown ? { ...view.place, view: view.id, ...shown } : null;
  }

  #recordAll(details: EventDetails[]): AnalyticsEvent[] {
    return this.#events.recordAll(details);
  }
}
