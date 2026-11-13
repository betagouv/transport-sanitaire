// Le port du chargement de la page, côté écran : comment la page qui embarque
// le simulateur s'est chargée. Le CMS en est l'adaptateur, ou le navigateur hors
// iframe (`host-page-load.adapter.ts`). Voir docs/knowledge/adr/analytics.md,
// ADR-13.

import type { Navigation } from "../../../shared/analytics/analytics-event";

/** Le navigateur ne dit rien, ou un type que le contrat ne connaît pas. */
export type UnknownNavigation = undefined;

export interface PageLoad {
  navigation(): Navigation | UnknownNavigation;
}
