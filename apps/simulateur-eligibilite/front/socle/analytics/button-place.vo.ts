// Où un bouton est exposé (ADR-0047, ANA22-02) : son écran, son affichage, la
// révision, et l'objet qu'il montre, la version de la fiche patient sur R2 ou
// celle du document sur R3. L'avis n'a pas d'objet à lui : il porte la révision,
// et le document en R3. Deux places égales disent que le bouton est resté où il
// était.

import type {
  AnalyticsEvent,
  ButtonId,
} from "../../../shared/analytics/analytics-event";

/** Un bouton de la fiche ou du document, ou l'avis. */
export type Button = ButtonId | "feedback";

/**
 * Ce que montre l'écran où le bouton est offert : l'écran et son affichage, la
 * révision, et les versions de la fiche et du document.
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

/** Ce que les événements du bouton disent de sa place. */
export type Placed = Pick<
  AnalyticsEvent,
  | "button_id"
  | "screen"
  | "page_view_id"
  | "revision"
  | "artifact_id"
  | "document_revision"
  | "document_id"
>;

/** Le bouton porte sur une fiche ou un document que l'écran ne montre pas. */
type NotOffered = null;

export class ButtonPlace {
  readonly button: Button;
  readonly fields: Placed;

  private constructor(button: Button, fields: Placed) {
    this.button = button;
    this.fields = fields;
  }

  /** La place du bouton sur l'écran, s'il y montre son objet. */
  static of(button: Button, on: ExposedOn): ButtonPlace | NotOffered {
    const { sheet, document, ...place } = on;
    if (button === "feedback") {
      if (!place.revision) return null;
      return new ButtonPlace(button, {
        ...place,
        ...(document && { document_id: document }),
      });
    }
    const fields = { button_id: button, ...place };
    if (button.startsWith("patient_sheet_"))
      return sheet
        ? new ButtonPlace(button, { ...fields, artifact_id: sheet })
        : null;
    if (!document) return null;
    return new ButtonPlace(button, {
      ...fields,
      artifact_id: document,
      document_revision: document,
      document_id: document,
    });
  }

  equals(other: ButtonPlace): boolean {
    return JSON.stringify(this.fields) === JSON.stringify(other.fields);
  }
}
