// Une révision du premier résultat (docs/knowledge/CONTEXT.md, « Révision ») :
// `r1`, `r2`… dans une simulation. Elle naît à l'affichage d'un R2, et tombe
// quand une modification de P1 ou de P2 la rend caduque. Ce qu'elle dit au
// journal ne vient que des sorties calculées (ADR-9). Les documents qui en
// viennent portent son support et son mode (ADR-10), puis la taille de leurs
// textes imprimés (ADR-12).

import type {
  AnalyticsEvent,
  Portion,
} from "../../../shared/analytics/analytics-event";
import type { Typography } from "./document-version.entity";

/** Ce que le prescripteur a vu au premier résultat. */
export type ShownResult = {
  /** Le bouton qui verrouille est posé. */
  readonly canComplete: boolean;
  /** Les codes que le modèle déclare. Aucun : le modèle n'en déclare pas. */
  readonly codes: ResultCodes | NoCodes;
  readonly motifs: readonly string[];
  readonly portions: readonly Portion[];
};

/**
 * Ce que le premier résultat donne au journal, des sorties calculées
 * seulement. `null` : la cible n'a pas de valeur, le champ ne part pas. Une
 * liste de codes vide part : les règles n'en ont donné aucun. Sans liste, il
 * leur manquait un fait.
 */
export type ResultCodes = {
  readonly issue: string | null;
  readonly mode: string | null;
  readonly reasonCodes: readonly string[] | null;
  readonly support: string | null;
  readonly financeur: string | null;
};

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
  | "reason_codes"
  | "support"
  | "financeur"
  | "motifs"
  | "portions"
>;

type DocumentEvent = Pick<
  AnalyticsEvent,
  | "type"
  | "screen"
  | "revision"
  | "document_id"
  | "support"
  | "mode"
  | "status"
  | "fields"
  | "unmeasured_field_ids"
>;

export class Revision {
  readonly id: string;
  readonly #rank: number;
  readonly #shown: ShownResult;

  private constructor(rank: number, shown: ShownResult) {
    this.#rank = rank;
    this.#shown = shown;
    this.id = `r${rank}`;
  }

  /** La première révision, née du R2 affiché. */
  static first(shown: ShownResult): Revision {
    return new Revision(1, shown);
  }

  /** La révision qui la suit, quand elle est tombée, née du R2 affiché. */
  next(shown: ShownResult): Revision {
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
      ...(shown.codes && fieldsOf(shown.codes)),
      motifs: [...shown.motifs],
      portions: [...shown.portions],
    };
  }

  /** Sa chute, depuis la phase dont une page l'a rendue caduque. */
  invalidated(screen: AnalyticsEvent["screen"]): ResultEvent {
    return { type: "result_invalidated", screen, revision: this.id };
  }

  /** Une version de son document, affichée. */
  documentDisplayed(documentId: string): DocumentEvent {
    const codes = this.#shown.codes;
    return {
      type: "document_displayed",
      screen: "R3",
      revision: this.id,
      document_id: documentId,
      ...(codes?.support != null && { support: codes.support }),
      ...(codes?.mode != null && { mode: codes.mode }),
    };
  }

  /**
   * La taille des textes imprimés d'une version de son document : complète si
   * chacun en a une, partielle sinon (ADR-12).
   */
  typographyMeasured(
    documentId: string,
    { sizes, unmeasured }: Typography,
  ): DocumentEvent {
    const codes = this.#shown.codes;
    return {
      type: "document_typography_measured",
      screen: "R3",
      revision: this.id,
      document_id: documentId,
      ...(codes?.support != null && { support: codes.support }),
      status: unmeasured.length === 0 ? "complete" : "partial",
      fields: Object.entries(sizes).map(([field_id, font_size_pt]) => ({
        field_id,
        font_size_pt,
      })),
      unmeasured_field_ids: [...unmeasured],
    };
  }

  /** Une génération ratée de son document. */
  documentFailed(): DocumentEvent {
    const codes = this.#shown.codes;
    return {
      type: "document_generation_failed",
      screen: "R3",
      revision: this.id,
      ...(codes?.support != null && { support: codes.support }),
    };
  }
}

// ---- implémentation ----

// Un code sans valeur ne part pas : le contrat lit son absence « inconnu ».
function fieldsOf(codes: ResultCodes): Omit<ResultEvent, "type"> {
  const { issue, mode, reasonCodes, support, financeur } = codes;
  return {
    ...(issue !== null && { issue }),
    ...(mode !== null && { mode }),
    ...(reasonCodes !== null && { reason_codes: [...reasonCodes] }),
    ...(support !== null && { support }),
    ...(financeur !== null && { financeur }),
  };
}
