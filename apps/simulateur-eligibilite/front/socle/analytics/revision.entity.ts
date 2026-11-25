// Une révision du premier résultat (docs/knowledge/CONTEXT.md, « Révision ») :
// `r1`, `r2`… dans une simulation. Elle naît à l'affichage d'un R2, et tombe
// quand une modification de P1 ou de P2 la rend caduque. Ce qu'elle dit au
// journal ne vient que des sorties calculées : son issue et son
// support toujours, sans quoi elle ne naît pas (contrat v10.2.2). Les
// documents qui en viennent portent son support, sa composition du transport
// et son mode (ANA22-04), puis la taille de leurs textes imprimés (ANA22-03),
// sous leur version et la révision du document (R13).

import type {
  Issue,
  Mode,
  Support,
  TransportComposition,
} from "../../../shared/analytics/analytics-event.constants";
import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event.types";
import { isDocumentSupport } from "../../../shared/analytics/typographic-fields.constants";
import type { ShownDocument, Typography } from "./document-version.entity";

/** Ce que le prescripteur a vu au premier résultat. */
export type ShownResult = {
  /** Le bouton qui verrouille est posé. */
  readonly canComplete: boolean;
  /** Les codes que le modèle déclare. Aucun : le modèle n'en déclare pas. */
  readonly codes: ResultCodes | NoCodes;
};

/**
 * Ce que le premier résultat donne au journal, des sorties calculées
 * seulement. `null` : la cible n'a pas de valeur. Sans issue ou sans support,
 * le premier résultat ne part pas ; sans mode, le champ ne part pas. Une
 * liste de codes vide part : les règles n'en ont donné aucun. Sans liste, il
 * leur manquait un fait. La composition du transport part toujours, et le mode
 * terrestre seulement quand elle en a un (ANA22-04).
 */
export type ResultCodes = {
  readonly issue: Issue | null;
  readonly mode: Mode | null;
  readonly transportComposition: TransportComposition;
  readonly reasonCodes: readonly string[] | null;
  readonly support: Support | null;
};

/** Un premier résultat dont les règles ont donné l'issue et le support. */
type ReportedResult = ShownResult & {
  readonly codes: ResultCodes & { issue: Issue; support: Support };
};

/** Ce que l'app lance sur le document : l'impression ou le téléchargement. */
export type DocumentRequest = "print" | "download";

/** Ce que l'app fait du document : le lancer, ou remettre son PDF. */
export type DocumentGesture =
  | `document_${DocumentRequest}_requested`
  | "document_download_succeeded";

/** Le modèle ne déclare pas les codes de son premier résultat. */
type NoCodes = null;

type ResultEvent = Pick<
  AnalyticsEvent,
  | "type"
  | "screen"
  | "revision"
  | "can_complete"
  | "issue"
  | "mode"
  | "transport_composition"
  | "reason_codes"
  | "support"
>;

type DocumentEvent = Pick<
  AnalyticsEvent,
  | "type"
  | "screen"
  | "revision"
  | "document_revision"
  | "document_id"
  | "support"
  | "transport_composition"
  | "mode"
  | "expected_field_ids"
  | "field_measurements"
>;

export class Revision {
  readonly id: string;
  readonly #rank: number;
  readonly #shown: ReportedResult;

  private constructor(rank: number, shown: ReportedResult) {
    this.#rank = rank;
    this.#shown = shown;
    this.id = `r${rank}`;
  }

  /** Vrai si le journal peut recevoir ce R2 : son issue et son support. */
  static canReport(shown: ShownResult): shown is ReportedResult {
    return shown.codes?.issue != null && shown.codes.support !== null;
  }

  /** La première révision, née du R2 affiché. */
  static first(shown: ReportedResult): Revision {
    return new Revision(1, shown);
  }

  /** La révision qui la suit, quand elle est tombée, née du R2 affiché. */
  next(shown: ReportedResult): Revision {
    return new Revision(this.#rank + 1, shown);
  }

  /** Son affichage, avec ce que le prescripteur a vu. */
  displayed(): ResultEvent {
    const shown = this.#shown;
    return {
      type: "result_displayed",
      screen: "R2",
      revision: this.id,
      can_complete: shown.canComplete,
      ...fieldsOf(shown.codes),
    };
  }

  /** Son document R3 n'a de support que celui d'un cerfa (ANA22-04). */
  get hasADocument(): boolean {
    return isDocumentSupport(this.#shown.codes.support);
  }

  /** Sa chute, depuis la phase dont une page l'a rendue caduque. */
  invalidated(screen: AnalyticsEvent["screen"]): ResultEvent {
    return { type: "result_invalidated", screen, revision: this.id };
  }

  /**
   * Son document invalidé par une page de P3 : la révision du document qu'on
   * attend désormais (R13).
   */
  documentInvalidated(expected: string): DocumentEvent {
    return {
      type: "document_invalidated",
      screen: "P3",
      revision: this.id,
      document_revision: expected,
    };
  }

  /** Une version de son document, affichée. */
  documentDisplayed(document: ShownDocument): DocumentEvent {
    const codes = this.#shown.codes;
    return {
      type: "document_displayed",
      screen: "R3",
      revision: this.id,
      document_revision: document.revisionId,
      document_id: document.id,
      support: codes.support,
      transport_composition: codes.transportComposition,
      ...(codes.mode !== null && { mode: codes.mode }),
    };
  }

  /**
   * La taille des textes imprimés d'une version de son document, sous les
   * identifiants fermés de son support : les champs remplis sont attendus,
   * ceux dont la taille s'est lue sont mesurés. Sans support de
   * document, elle ne part pas : ses identifiants n'auraient pas de préfixe.
   */
  typographyMeasured(
    document: ShownDocument,
    { sizes, unmeasured }: Typography,
  ): DocumentEvent[] {
    const support = this.#shown.codes.support;
    if (!isDocumentSupport(support)) return [];
    const measurements = Object.entries(sizes).map(
      ([field_id, font_size_pt]) => ({ field_id, font_size_pt }),
    );
    return [
      {
        type: "document_typography_measured",
        screen: "R3",
        revision: this.id,
        document_revision: document.revisionId,
        document_id: document.id,
        support,
        expected_field_ids: [...Object.keys(sizes), ...unmeasured],
        field_measurements: measurements,
      },
    ];
  }

  /**
   * L'impression ou le téléchargement de son document lancés, ou son PDF remis
   * au navigateur : des gestes de l'app, pas des clics (ANA22-02).
   */
  aboutItsDocument(
    type: DocumentGesture,
    document: ShownDocument,
  ): DocumentEvent {
    return {
      type,
      screen: "R3",
      revision: this.id,
      document_revision: document.revisionId,
      document_id: document.id,
    };
  }

  /** Une génération ratée de son document. */
  documentFailed(): DocumentEvent {
    return {
      type: "document_generation_failed",
      screen: "R3",
      revision: this.id,
      support: this.#shown.codes.support,
    };
  }
}

// ---- implémentation ----

// Un code sans valeur ne part pas : le contrat lit son absence « inconnu ».
function fieldsOf(
  codes: ReportedResult["codes"],
): Omit<ResultEvent, "type" | "screen" | "revision" | "can_complete"> {
  const { issue, mode, transportComposition, reasonCodes, support } = codes;
  return {
    issue,
    support,
    transport_composition: transportComposition,
    ...(mode !== null && { mode }),
    ...(reasonCodes !== null && { reason_codes: [...reasonCodes] }),
  };
}
