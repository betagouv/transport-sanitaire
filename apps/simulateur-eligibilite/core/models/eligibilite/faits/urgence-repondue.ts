// fait_urgence_repondue : question d'urgence DAP répondue.
//
// Q2.3.4, ou Q2.12 quand la branche la reprend, a sa réponse : « Oui » comme
// « Non » l'établissent.
//
// Il suit `CONTRAT_REPONSES_FAITS.json`.

import { Urgence } from "../concepts/urgence.ts";
import type { DeclarationDeFait } from "../declarations/faits.ts";

export const urgenceRepondue: DeclarationDeFait = ({ validated }) =>
  Urgence.of(validated).repondue();
