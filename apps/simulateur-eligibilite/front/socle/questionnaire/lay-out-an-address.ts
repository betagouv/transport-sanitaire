// Les champs d'une adresse tels qu'ils se présentent : leur libellé, leur
// format, et leur place sur la ligne. Le moteur (`core/`) dit lesquels se
// demandent ; l'écran dit comment.

import type {
  AddressFieldName,
  AskedField,
} from "../../../core/socle/questionnaire-engine/question/address";
import type { AskedAddress } from "../../../core/socle/questionnaire-engine/question/asked/address";
import { displayedLabel } from "./label-a-question";

/** Un champ d'une adresse, tel qu'il se présente. */
export type DisplayedField = AskedField & {
  readonly label: string;
  readonly hint?: string;
  /** Un champ court, pour une saisie de quelques caractères. */
  readonly short?: boolean;
  /** Le champ se range sur la ligne de celui qui le précède. */
  readonly sameLine?: boolean;
};

/** Les champs d'une adresse qui se demandent, dans l'ordre de la saisie. */
export function displayedFields(question: AskedAddress): DisplayedField[] {
  return question.fields().map((field) => ({
    ...field,
    ...PRESENTATION[field.name],
    label: displayedLabel(LABELS[field.name], field.optional),
    // Le format se rappelle quand il est imposé : en France.
    ...(field.name === "postalCode" &&
      !field.optional && { hint: "Format attendu : 5 chiffres" }),
  }));
}

// ---- implémentation ----

const LABELS: Record<AddressFieldName, string> = {
  placeName: "Nom du lieu",
  street: "Numéro et voie",
  complement: "Complément",
  postalCode: "Code postal",
  city: "Commune",
  country: "Pays",
};

// Le code postal est court, et la commune le suit sur sa ligne.
const PRESENTATION: Partial<
  Record<AddressFieldName, { short?: boolean; sameLine?: boolean }>
> = {
  postalCode: { short: true },
  city: { sameLine: true },
};
