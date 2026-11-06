// Corriger une réponse d'avant depuis une alerte (NAV-LIEUX-CORRECTION-001,
// ADR-30) : un lien rouvre la page de la réponse à revoir, et « Suivant »
// ramène vers la page qui portait l'alerte. La simulation tient la correction
// en cours (`Simulation.revisit`) ; ce fichier dit où elle reprend, et ce
// qu'ouvre une position de l'adresse (`Simulation.moveTo`).

import type { Answers, Page, Reading } from "../questionnaire-engine/index.ts";
import type { Position } from "./position.ts";
import { pendingIn } from "./stages.ts";

/**
 * Une correction en cours : la page qui portait l'alerte, son brouillon, et
 * son rang quand la correction a commencé.
 */
export type Correction = {
  readonly origin: Page;
  readonly draft: Answers;
  readonly returnTo: number;
};

/**
 * Ce qu'une page ouverte garde d'une correction : la correction encore en
 * cours, ou le brouillon que la page d'origine retrouve à la fin.
 */
export type Opened = {
  readonly correction?: Correction;
  readonly draft?: Answers;
};

/** La page qu'une validation ouvre, et ce qu'elle garde de la correction. */
export type Opening = Opened & { readonly page: Page };

/** Rien n'attend de réponse : l'étape s'achève. */
export type StageEnds = undefined;

/** La simulation refuse d'aller là : elle reste où elle est. */
export type Refused = undefined;

/**
 * Où reprend une correction validée, sur ces réponses relues. D'abord une
 * question devenue nécessaire sur une page d'avant l'origine (`declared` dit
 * l'ordre des pages) : la correction continue. Sinon la page d'origine, si elle
 * se pose encore, avec son brouillon. Si elle ne se pose plus, la page qui
 * attend une réponse.
 */
export function whereACorrectionResumes(
  correction: Correction,
  reading: Reading,
  answers: Answers,
  declared: readonly Page[],
): Opening | StageEnds {
  const pages = reading.askedPages();
  const pending = pages.find(pendingIn(reading, answers));
  const { origin } = correction;
  if (pending && declared.indexOf(pending) < declared.indexOf(origin))
    return { page: pending, correction };
  if (pages.includes(origin)) return { page: origin, draft: correction.draft };
  return pending && { page: pending };
}

/**
 * Ce qu'ouvre cette position : une page déjà posée, avant le verrou, que rien
 * de neuf ne sépare de la page ouverte (`reached`, de `reachedPages`).
 * `returnTo` reprend une correction vers une page plus loin, qui attend sa
 * réponse. `kept` : le brouillon que la simulation garde pour une page ; la
 * page le retrouve, et le brouillon d'une correction suit son origine.
 */
export function openingAt(
  { step, returnTo }: Position,
  reached: readonly Page[],
  isPending: (page: Page) => boolean,
  kept: Kept | NoDraft,
): Opening | Refused {
  const page = reached[step - 1];
  if (!page) return undefined;
  const draftOf = (on: Page) => (kept?.page === on ? kept.draft : undefined);
  if (returnTo === undefined) return { page, draft: draftOf(page) };
  const origin = reached[returnTo - 1];
  if (!origin || returnTo <= step || !isPending(origin)) return undefined;
  const correction = { origin, draft: draftOf(origin) ?? {}, returnTo };
  return { page, correction };
}

/** Le brouillon qu'une page ouverte garde, et la page à qui il revient. */
export function keptDraft(
  { correction, draft }: Opened,
  page: Page | undefined,
): Kept | NoDraft {
  if (correction) return { page: correction.origin, draft: correction.draft };
  return page && draft ? { page, draft } : undefined;
}

// ---- implémentation ----

type Kept = { readonly page: Page; readonly draft: Answers };

// La page ouverte ne garde aucun brouillon d'une correction.
type NoDraft = undefined;
