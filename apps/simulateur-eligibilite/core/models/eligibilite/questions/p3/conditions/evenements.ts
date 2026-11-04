// La date d'un évènement de Q3.6 : elle est passée.

import type { Answered } from "../../../../../socle/index.ts";
import { given } from "../../question.ts";

/** Le message d'une date d'accident à venir. */
export const DATE_FUTURE =
  "Cette date est dans le futur : un accident ne peut pas encore avoir eu lieu.";

/** La date répondue est après aujourd'hui, à Paris. */
export function dansLeFutur(date: Answered<string>) {
  return given.question(date).answer().toDate().isAfter(given.today());
}
