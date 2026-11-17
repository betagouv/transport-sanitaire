// Un bouton exposé sur un écran de résultat (ADR-0047, ANA22-02) : « Imprimer »
// ou « Télécharger » sur la fiche patient ou le document R3, ou « Donner mon
// avis ». Son exposition dure tant qu'il reste à la même place, et chacun de
// ses clics s'y rattache.

import type { AnalyticsEvent } from "../../../shared/analytics/analytics-event";
import type { ButtonPlace, Placed } from "./button-place.vo";

type ButtonEvent = Placed &
  Pick<AnalyticsEvent, "type" | "exposure_id" | "activity_origin">;

export class ButtonExposure {
  readonly id: string;
  readonly #place: ButtonPlace;

  constructor(id: string, place: ButtonPlace) {
    this.id = id;
    this.#place = place;
  }

  /** L'écran où il est exposé. */
  get screen(): AnalyticsEvent["screen"] {
    return this.#place.fields.screen;
  }

  /** Le bouton est toujours à cette place. */
  isAt(place: ButtonPlace): boolean {
    return this.#place.equals(place);
  }

  exposed(): ButtonEvent {
    const type = this.#isFeedback() ? "feedback_exposed" : "button_exposed";
    return { type, ...this.#about() };
  }

  /** Son clic, qui vient toujours du prescripteur. */
  clicked(): ButtonEvent {
    if (this.#isFeedback())
      return { type: "feedback_clicked", ...this.#about() };
    return {
      type: "button_clicked",
      activity_origin: "user",
      ...this.#about(),
    };
  }

  // ---- implémentation ----

  #isFeedback(): boolean {
    return this.#place.button === "feedback";
  }

  #about(): Placed & Pick<AnalyticsEvent, "exposure_id"> {
    return { ...this.#place.fields, exposure_id: this.id };
  }
}
