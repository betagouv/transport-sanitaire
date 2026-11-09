// La position de la simulation dans l'adresse de la page, en hash (ADR-30) :
// `#/etape/<n>`, et pendant une correction `#/etape/<n>?retour=<m>`. Des rangs
// seulement : ni page, ni réponse, ni donnée. La simulation dit lesquels elle
// accepte (`Simulation.moveTo`).

import type { Position } from "../../../core/socle/simulation";

/** Le hash de cette position. */
export function hashOf({ step, returnTo }: Position): string {
  const hash = `#/etape/${step}`;
  return returnTo === undefined ? hash : `${hash}?retour=${returnTo}`;
}

/** La position que dit ce hash. */
export function positionIn(hash: string): Position | NotAPosition {
  const lue = HASH.exec(hash);
  if (!lue) return undefined;
  const [, step, returnTo] = lue;
  if (returnTo === undefined) return { step: Number(step) };
  return { step: Number(step), returnTo: Number(returnTo) };
}

// ---- implémentation ----

// Le hash ne dit aucune position : ni rang, ni rang de retour lisibles.
type NotAPosition = undefined;

const HASH = /^#\/etape\/([1-9]\d{0,3})(?:\?retour=([1-9]\d{0,3}))?$/;
