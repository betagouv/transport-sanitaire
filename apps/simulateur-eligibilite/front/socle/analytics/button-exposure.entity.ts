// Un bouton exposé sur un écran de résultat (ADR-11) : « Imprimer » ou
// « Télécharger » sur la fiche patient ou le document R3, ou « Donner mon
// avis ». Il est exposé une fois par affichage et par version de son objet, et
// ses clics s'y rattachent, quel que soit l'affichage ouvert depuis.

import type {
  Action,
  AnalyticsEvent,
} from "../../../shared/analytics/analytics-event";

export type Button =
  | "sheet_print"
  | "sheet_download"
  | "document_print"
  | "document_download"
  | "feedback";

/**
 * Où le bouton est exposé : l'écran et son affichage, la révision, et les
 * versions de la fiche et du document que l'écran montre.
 */
export type ExposedOn = Pick<
  AnalyticsEvent,
  "screen" | "page_view_id" | "revision"
> & {
  readonly sheet: string | NoVersion;
  readonly document: string | NoVersion;
};

/** L'écran ne montre pas de fiche, ou pas de document. */
type NoVersion = null;

/** Les boutons exposés d'un affichage, chacun au plus une fois. */
export type Exposures = { readonly [B in Button]?: ButtonExposure };

// Ce que les événements du bouton disent de lui, hors du type et de l'action.
type Place = Pick<
  AnalyticsEvent,
  "screen" | "page_view_id" | "revision" | "sheet_id" | "document_id"
>;

type ButtonEvent = Pick<
  AnalyticsEvent,
  | "type"
  | "screen"
  | "page_view_id"
  | "exposure_id"
  | "revision"
  | "action"
  | "sheet_id"
  | "document_id"
>;

/** Le bouton ne télécharge pas : rien ne réussit après son clic. */
type NoSuccess = null;

/** Le bouton porte sur une fiche ou un document que l'écran ne montre pas. */
type NotOffered = null;

export class ButtonExposure {
  readonly id: string;
  readonly button: Button;
  readonly #on: Place;

  private constructor(button: Button, on: Place, object: string) {
    this.button = button;
    this.#on = on;
    this.id = `${on.page_view_id}:${button}:${object}`;
  }

  /** Le bouton exposé là, si l'écran montre son objet. */
  static of(button: Button, on: ExposedOn): ButtonExposure | NotOffered {
    const { sheet, document, ...place } = on;
    const exposure = (object: string, own: Place) =>
      new ButtonExposure(button, own, object);
    if (button.startsWith("sheet_"))
      return sheet ? exposure(sheet, { ...place, sheet_id: sheet }) : null;
    if (document)
      return exposure(document, { ...place, document_id: document });
    const { revision } = place;
    return button === "feedback" && revision ? exposure(revision, place) : null;
  }

  exposed(): ButtonEvent {
    const { exposed, action } = GESTURES[this.button];
    return { type: exposed, ...this.#about(), ...(action && { action }) };
  }

  /** Son clic : la demande d'impression ou de téléchargement, ou l'avis. */
  requested(): ButtonEvent {
    return { type: GESTURES[this.button].requested, ...this.#about() };
  }

  /** Le PDF remis au navigateur, après le clic d'un bouton qui télécharge. */
  succeeded(): ButtonEvent | NoSuccess {
    const { succeeded } = GESTURES[this.button];
    return succeeded ? { type: succeeded, ...this.#about() } : null;
  }

  #about(): Omit<ButtonEvent, "type" | "action"> {
    return { ...this.#on, exposure_id: this.id };
  }
}

// ---- implémentation ----

type EventType = AnalyticsEvent["type"];

type Gestures = {
  readonly exposed: EventType;
  readonly action?: Action;
  readonly requested: EventType;
  readonly succeeded?: EventType;
};

// Les types de l'éditeur pour le document et l'avis ; nos compléments pour la
// fiche, et pour exposer les boutons qui impriment et téléchargent.
const GESTURES: Record<Button, Gestures> = {
  sheet_print: {
    exposed: "action_exposed",
    action: "print",
    requested: "sheet_print_requested",
  },
  sheet_download: {
    exposed: "action_exposed",
    action: "download",
    requested: "sheet_download_requested",
    succeeded: "sheet_download_succeeded",
  },
  document_print: {
    exposed: "action_exposed",
    action: "print",
    requested: "document_print_requested",
  },
  document_download: {
    exposed: "action_exposed",
    action: "download",
    requested: "document_download_requested",
    succeeded: "document_download_succeeded",
  },
  feedback: { exposed: "feedback_exposed", requested: "feedback_clicked" },
};
