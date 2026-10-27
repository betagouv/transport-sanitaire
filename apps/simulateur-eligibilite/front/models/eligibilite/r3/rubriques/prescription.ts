// La date de la prescription : le jour de Paris où P3 a été validée
// (`cible_date_completion`). Elle se fige pour les téléchargements de ce
// résultat, et ne remplace aucune date de soins, d'accident ou de permission.

import { given } from "../../../../../core/models/eligibilite/question";
import type { Rubrique } from "./rubrique";

export type Prescription = {
  /** `AAAA-MM-JJ`. */
  readonly date_prescription: string;
};

// Le jour de la complétion se lit toujours : `today()` ne le laisse illisible
// qu'avec une horloge déréglée, et la cellule reste alors vide.
export const PRESCRIPTION: Rubrique<Prescription> = {
  date_prescription: given.today().compute((jour) => jour.day() ?? ""),
};
