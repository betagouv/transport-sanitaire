// La date d'un évènement de Q3.6 : elle est passée.

import { given } from "../../question.ts";

/** Le message d'une date d'accident à venir. */
export const DATE_FUTURE =
  "Cette date est dans le futur : un accident ne peut pas encore avoir eu lieu.";

/** La date répondue est après aujourd'hui, à Paris. */
export function dansLeFutur(id: "Q3.6.1" | "Q3.6.3") {
  return given.question(id).answer().toDate().isAfter(given.today());
}
