// Les boutons exposés d'une simulation (ADR-0047, ANA22-02) : au plus une
// exposition courante par bouton. Un bouton offert de nouveau à la même place
// garde la sienne : un rendu ou un montage de plus ne change rien. Une autre
// place (un autre affichage, une autre révision, un autre objet), ou un bouton
// retiré puis offert de nouveau, en ouvre une nouvelle. Un clic part avec
// l'exposition courante de son bouton, si l'écran le montre encore à sa place.

import type {
  EventDetails,
  Screen,
} from "../../../shared/analytics/analytics-event";
import { ButtonExposure } from "./button-exposure.entity";
import { type Button, ButtonPlace, type ExposedOn } from "./button-place.vo";

/** L'écran ne montre plus rien où un bouton serait. */
export type NotShown = null;

export class ExposedButtons {
  readonly #simulationId: string;
  readonly #current = new Map<Button, ButtonExposure>();
  #count = 0;

  constructor(simulationId: string) {
    this.#simulationId = simulationId;
  }

  /** Les boutons offerts là : seuls ceux qui changent de place partent. */
  expose(buttons: readonly Button[], on: ExposedOn): EventDetails[] {
    return buttons.flatMap((button) => {
      const place = ButtonPlace.of(button, on);
      if (!place || this.#current.get(button)?.isAt(place)) return [];
      this.#count += 1;
      const id = `${this.#simulationId}:b${this.#count}`;
      const exposure = new ButtonExposure(id, place);
      this.#current.set(button, exposure);
      return [exposure.exposed()];
    });
  }

  /** Un clic : celui de l'exposition courante, si le bouton y est encore. */
  click(button: Button, on: ExposedOn | NotShown): EventDetails[] {
    const exposure = this.#current.get(button);
    const place = on && ButtonPlace.of(button, on);
    return exposure && place && exposure.isAt(place)
      ? [exposure.clicked()]
      : [];
  }

  /** Les boutons d'un écran, ou tous, ne sont plus affichés. */
  withdraw(screen?: Screen): void {
    for (const [button, exposure] of this.#current)
      if (!screen || exposure.screen === screen) this.#current.delete(button);
  }
}
