// Les résultats d'une simulation, tels que le journal les reçoit : les
// révisions du premier résultat (ADR-0045), les révisions du document R3 qui en
// viennent (R13), ses versions (ADR-0046) et leurs tailles imprimées
// (ADR-0048), et les versions de la fiche patient (ADR-0047). `Journey` les
// numérote dans l'ordre du parcours.

import type {
  EventDetails,
  Screen,
} from "../../../shared/analytics/analytics-event";
import type { Button, ExposedOn } from "./button-place.vo";
import { DocumentRevision } from "./document-revision.entity";
import {
  type DocumentContent,
  DocumentVersion,
} from "./document-version.entity";
import {
  type DocumentGesture,
  Revision,
  type ShownResult,
} from "./revision.entity";
import { SheetVersion } from "./sheet-version.entity";

type ResultEvent = EventDetails;

/** Aucune révision : pas de R2 affiché, ou le dernier est tombé. */
export type NoRevision = null;

/** Aucun document encore affiché, ou aucune fiche. */
type NoVersion = null;

/** Ce que montre l'écran d'un bouton : la révision, la fiche, le document. */
export type ShownOn = Pick<ExposedOn, "revision" | "sheet" | "document">;

export class Results {
  #lastRevision: Revision | NoRevision = null;
  #revision: Revision | NoRevision = null;
  #documentRevision: DocumentRevision | NoVersion = null;
  #document: DocumentVersion | NoVersion = null;
  #sheet: SheetVersion | NoVersion = null;

  /** La révision courante. */
  get current(): Revision | NoRevision {
    return this.#revision;
  }

  /**
   * Une nouvelle révision, sauf s'il réaffiche la révision courante, ou que
   * les règles n'en donnent ni l'issue ni le support.
   */
  display(shown: ShownResult): ResultEvent[] {
    if (this.#revision || !Revision.canReport(shown)) return [];
    const revision = this.#lastRevision?.next(shown) ?? Revision.first(shown);
    this.#revision = revision;
    this.#lastRevision = revision;
    return [revision.displayed()];
  }

  /** La révision courante tombe, depuis la phase qui l'a rendue caduque. */
  invalidate(screen: Screen): ResultEvent[] {
    const revision = this.#revision;
    if (!revision) return [];
    this.#revision = null;
    return [revision.invalidated(screen)];
  }

  /**
   * Une nouvelle version du document, et la taille de ses textes imprimés, sauf
   * s'il montre la dernière. Sans support de cerfa, aucun document.
   */
  displayDocument(content: DocumentContent): ResultEvent[] {
    const revision = this.#revision;
    if (!revision?.hasADocument) return [];
    const expected = this.#expectedFrom(revision);
    if (this.#document?.shows(expected, content)) return [];
    const document =
      this.#document?.next(expected, content) ??
      DocumentVersion.first(expected, content);
    this.#document = document;
    return [
      revision.documentDisplayed(document),
      ...revision.typographyMeasured(document, content.typography),
    ];
  }

  /**
   * Le document affiché tombe, quand une page de P3 change les réponses : la
   * révision suivante du document est attendue. Sans document, rien.
   */
  invalidateTheDocument(): ResultEvent[] {
    const revision = this.#revision;
    const current = this.#documentRevision;
    if (!revision || !current || !this.#documentOf(revision)) return [];
    this.#documentRevision = current.next(revision);
    return [revision.documentInvalidated(this.#documentRevision.id)];
  }

  failADocument(): ResultEvent[] {
    const revision = this.#revision;
    return revision ? [revision.documentFailed()] : [];
  }

  /**
   * Ce que l'app fait du dernier document affiché. Sans révision courante, ou
   * sans document qui en vienne, rien.
   */
  handleTheDocument(gesture: DocumentGesture): ResultEvent[] {
    const revision = this.#revision;
    const document = this.#documentOf(revision);
    return revision && document
      ? [revision.aboutItsDocument(gesture, document)]
      : [];
  }

  /**
   * Ce que montre l'écran où des boutons sont offerts : en R3, le document ; en
   * R2, la fiche, si un bouton y porte. Sans révision courante, aucun bouton.
   */
  shownOn(
    screen: Screen | undefined,
    buttons: readonly Button[],
  ): ShownOn | NoRevision {
    const revision = this.#revision;
    if (!revision) return null;
    if (screen === "R3")
      return {
        revision: revision.id,
        sheet: null,
        document: this.#documentOf(revision),
      };
    const onSheet = buttons.some((button) =>
      button.startsWith("patient_sheet_"),
    );
    const sheet = onSheet ? this.#sheetOf(revision).id : null;
    return { revision: revision.id, sheet, document: null };
  }

  // ---- implémentation ----

  // La révision du document attendue sous ce R2 : la courante, ou la suivante.
  #expectedFrom(revision: Revision): DocumentRevision {
    if (this.#documentRevision?.of(revision)) return this.#documentRevision;
    this.#documentRevision =
      this.#documentRevision?.next(revision) ??
      DocumentRevision.first(revision);
    return this.#documentRevision;
  }

  // Le dernier document, s'il vient de la révision du document attendue sous
  // ce R2.
  #documentOf(revision: Revision | NoRevision): DocumentVersion | NoVersion {
    const document = this.#document;
    const expected = this.#documentRevision;
    return revision && expected?.of(revision) && document?.of(expected)
      ? document
      : null;
  }

  #sheetOf(revision: Revision): SheetVersion {
    if (this.#sheet?.of(revision)) return this.#sheet;
    this.#sheet = this.#sheet?.next(revision) ?? SheetVersion.first(revision);
    return this.#sheet;
  }
}
