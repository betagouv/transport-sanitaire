// Les phrases que l'écran écrit autour d'une question : « (facultatif) » après
// un libellé, les messages d'une saisie fautive, les libellés des champs d'une
// adresse. Le moteur de questionnaire (`core/`) dit ce qu'il constate : une
// question facultative, la nature d'un problème. Les phrases de l'éditeur lui viennent toutes faites.

import type {
  AddressFieldName,
  AskedField,
} from "../../../core/socle/questionnaire-engine/address";
import type { AnswerProblem } from "../../../core/socle/questionnaire-engine/answer-problem";
import type { AskedAddress } from "../../../core/socle/questionnaire-engine/asked-address";
import type { AskedQuestion } from "../../../core/socle/questionnaire-engine/asked-question";
import type {
  Answer,
  Unanswered,
} from "../../../core/socle/questionnaire-engine/question";

/** Le libellé tel qu'il s'affiche : une question facultative le dit. */
export function displayedLabel(label: string, optional?: boolean): string {
  return optional ? `${label} (facultatif)` : label;
}

/** Ce qui ne va pas dans une saisie, un message par ligne sous le champ. */
export function errorsOf(
  question: AskedQuestion,
  answer: Answer | Unanswered,
): readonly string[] {
  return question.problemsWith(answer).map(messageOf);
}

/** Le message d'un problème de saisie. */
export function messageOf(problem: AnswerProblem): string {
  switch (problem.kind) {
    case "missing":
      return "Cette réponse est attendue.";
    case "nothing checked":
      return "Cochez au moins une réponse.";
    case "not a number":
      return "Indiquez un nombre.";
    case "not an integer":
      return "Indiquez un nombre entier, sans décimale.";
    case "number below":
      return `Indiquez un nombre d’au moins ${problem.min}.`;
    case "number above":
      return `Indiquez un nombre d’au plus ${problem.max}.`;
    case "date before":
      return `Indiquez une date à partir du ${displayedDate(problem.min)}.`;
    case "date after":
      return `Indiquez une date au plus tard le ${displayedDate(problem.max)}.`;
    case "invalid postal code":
      return "Indiquez un code postal de 5 chiffres.";
    case "stated":
      return problem.text;
  }
}

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

// « 2026-10-12T08:30 » se lit « 12/10/2026 à 08:30 ».
function displayedDate(iso: string): string {
  const [date = "", time] = iso.split("T");
  const [year, month, day] = date.split("-");
  const displayed = `${day}/${month}/${year}`;
  return time ? `${displayed} à ${time.slice(0, 5)}` : displayed;
}
