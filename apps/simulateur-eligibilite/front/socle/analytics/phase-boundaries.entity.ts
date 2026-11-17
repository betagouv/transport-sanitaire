// Les limites des phases affichées dans une simulation : la première et la
// dernière page de P1, de P2 et de P3, au moment où le prescripteur les voit
// (REFERENTIEL/10 du paquet v10.2.2). Une limite part une fois par page : une
// page rouverte ne la redit pas, une autre page devenue la dernière la dit à son
// tour. Un changement de parcours ne refait pas une limite déjà affichée. Voir
// ADR-0044.

import type { EventDetails } from "../../../shared/analytics/analytics-event";
import type { PageView } from "./page-view.entity";

export class PhaseBoundaries {
  readonly #displayed = new Set<string>();

  /** Les limites que l'affichage montre pour la première fois. */
  display(view: PageView): EventDetails[] {
    const { phase } = view;
    if (!phase) return [];
    return view.boundaries.flatMap((boundary) => {
      const key = `${phase}:${boundary}:${view.pageId}`;
      if (this.#displayed.has(key)) return [];
      this.#displayed.add(key);
      return [
        {
          type: "phase_boundary_displayed" as const,
          screen: phase,
          boundary,
          page_id: view.pageId,
        },
      ];
    });
  }
}
