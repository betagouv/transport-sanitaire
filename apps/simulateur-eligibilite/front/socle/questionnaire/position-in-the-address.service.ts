// La position de la simulation dans l'adresse de la page, en hash (ADR-0041) :
// `#/etape/<n>`, et pendant une correction `#/etape/<n>?retour=<m>`. Des rangs
// seulement : ni page, ni réponse, ni donnée. La simulation dit lesquels elle
// accepte (`Simulation.moveTo`).

import { JourneyPosition } from "../../../core/socle/simulation";

// Le hash ne dit aucune position : ni rang, ni rang de retour lisibles.
type NotAPosition = undefined;

export class PositionInTheAddressService {
  /** Le hash de cette position. */
  static hashOf({ step, returnTo }: JourneyPosition): string {
    const hash = `#/etape/${step}`;
    return returnTo === undefined ? hash : `${hash}?retour=${returnTo}`;
  }

  /** La position que dit ce hash. */
  static positionIn(hash: string): JourneyPosition | NotAPosition {
    const lue = PositionInTheAddressService.#HASH.exec(hash);
    if (!lue) return undefined;
    const [, step, returnTo] = lue;
    if (returnTo === undefined) return new JourneyPosition(Number(step));
    return new JourneyPosition(Number(step), Number(returnTo));
  }

  static readonly #HASH =
    /^#\/etape\/([1-9]\d{0,3})(?:\?retour=([1-9]\d{0,3}))?$/;
}
