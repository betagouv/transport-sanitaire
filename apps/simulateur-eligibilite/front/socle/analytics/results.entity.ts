// Les résultats d'une simulation, tels que le journal les reçoit : les
// révisions du premier résultat (ADR-9), les versions du document R3 qui en
// viennent (ADR-10) et leurs tailles imprimées (ADR-12), et les versions de la
// fiche patient (ADR-11). `Journey` les
// numérote dans l'ordre du parcours.

import type {
  EventDetails,
  Screen,
} from "../../../shared/analytics/analytics-event";
import type { Button, ExposedOn } from "./button-exposure.entity";
import {
  type DocumentContent,
  DocumentVersion,
} from "./document-version.entity";
import { Revision, type ShownResult } from "./revision.entity";
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
  #document: DocumentVersion | NoVersion = null;
  #sheet: SheetVersion | NoVersion = null;

  /** La révision courante. */
  get current(): Revision | NoRevision {
    return this.#revision;
  }

  /** Une nouvelle révision, sauf s'il réaffiche la révision courante. */
  display(shown: ShownResult): ResultEvent[] {
    if (this.#revision) return [];
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
   * s'il montre la dernière.
   */
  displayDocument(content: DocumentContent): ResultEvent[] {
    const revision = this.#revision;
    if (!revision || this.#document?.shows(revision, content)) return [];
    const document =
      this.#document?.next(revision, content) ??
      DocumentVersion.first(revision, content);
    this.#document = document;
    return [
      revision.documentDisplayed(document.id),
      revision.typographyMeasured(document.id, content.typography),
    ];
  }

  failADocument(): ResultEvent[] {
    const revision = this.#revision;
    return revision ? [revision.documentFailed()] : [];
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
        document: this.#document?.id ?? null,
      };
    const onSheet = buttons.some((button) => button.startsWith("sheet_"));
    const sheet = onSheet ? this.#sheetOf(revision).id : null;
    return { revision: revision.id, sheet, document: null };
  }

  // ---- implémentation ----

  #sheetOf(revision: Revision): SheetVersion {
    if (this.#sheet?.of(revision)) return this.#sheet;
    this.#sheet = this.#sheet?.next(revision) ?? SheetVersion.first(revision);
    return this.#sheet;
  }
}
