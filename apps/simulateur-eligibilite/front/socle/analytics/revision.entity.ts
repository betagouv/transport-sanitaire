// Une révision du premier résultat (docs/knowledge/CONTEXT.md, « Révision ») :
// `r1`, `r2`… dans une simulation. Elle naît à l'affichage d'un R2, et tombe
// quand une modification de P1 ou de P2 la rend caduque. Ce qu'elle dit au
// journal ne vient que des sorties calculées (ADR-9).

import type {
  AnalyticsEvent,
  Portion,
} from "../../../shared/analytics/analytics-event";

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

export class Revision {
  readonly id: string;
  readonly #rank: number;

  private constructor(rank: number) {
    this.#rank = rank;
    this.id = `r${rank}`;
  }

  static first(): Revision {
    return new Revision(1);
  }

  /** La révision qui la suit, quand elle est tombée. */
  next(): Revision {
    return new Revision(this.#rank + 1);
  }

  /** Son affichage, avec ce que le prescripteur a vu. */
  displayed(shown: ShownResult): ResultEvent {
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
