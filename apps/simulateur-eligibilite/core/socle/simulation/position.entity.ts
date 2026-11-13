// La position d'une simulation dans son parcours, en rangs (ADR-30) : de quoi
// la situer, dans l'adresse de la page par exemple, sans rien dire de ses
// réponses ni de ses pages. La simulation la donne (`Simulation.position`), et
// n'accepte d'y aller que vers une page déjà posée, avant le verrou
// (`Simulation.moveTo`).

import type { Page } from "../questionnaire-engine/index.ts";
import type { Stage } from "./stage.entity.ts";

/**
 * Un rang du parcours, compté depuis 1 : les pages du questionnaire, son
 * résultat, les pages du complément, puis le cerfa. `returnTo` : pendant une
 * correction, le rang de la page qui portait l'alerte.
 */
export type Position = { readonly step: number; readonly returnTo?: number };

/**
 * Le rang de cette page à cette étape. `asked` : toutes les pages posées,
 * celles d'avant le verrou comprises ; `pages` : celles de l'étape.
 */
export function stepOf(
  stage: Stage,
  asked: readonly Page[],
  pages: readonly Page[],
  page: Page | undefined,
): number {
  const at = page ? pages.indexOf(page) + 1 : 1;
  if (stage.name === "questionnaire") return at;
  if (stage.name === "resultat") return pages.length + 1;
  const before = asked.length - pages.length;
  if (stage.name === "complement") return before + 1 + at;
  return before + 2 + pages.length;
}

/**
 * Les pages où l'on peut aller sans rien répondre de plus : jusqu'à la
 * première qui attend une réponse, elle comprise.
 */
export function reachedPages(
  pages: readonly Page[],
  isPending: (page: Page) => boolean,
): readonly Page[] {
  const first = pages.findIndex(isPending);
  return first === -1 ? pages : pages.slice(0, first + 1);
}
