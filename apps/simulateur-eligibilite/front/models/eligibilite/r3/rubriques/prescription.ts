// La date de la prescription : le jour de Paris où P3 a été validée
// (`cible_date_completion`). Elle se fige pour les téléchargements de ce
// résultat, et ne remplace aucune date de soins, d'accident ou de permission.

import { jourAParis } from "../../../../../core/models/eligibilite/p3/pages-des-evenements";
import type { Rubrique } from "./rubrique";

export type Prescription = {
  /** `AAAA-MM-JJ`. */
  readonly date_prescription: string;
};

export const PRESCRIPTION: Rubrique<Prescription> = {
  date_prescription: ({ completedAt }) => jourAParis(completedAt),
};
