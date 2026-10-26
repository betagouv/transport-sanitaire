// La date de la prescription : le jour de Paris où P3 a été validée. Elle se fige pour les téléchargements de ce
// résultat, et ne remplace aucune date de soins, d'accident ou de permission.

import { jourAParis } from "../../../../../core/models/eligibilite/p3/pages-des-evenements";
import { uneRubrique } from "./rubrique";

export type Prescription = {
  /** `AAAA-MM-JJ`. */
  readonly date_prescription: string;
};

// Elle ne lit que `completedAt`, hors de `lit` : une date de validation, pas
// une réponse.
export const PRESCRIPTION = uneRubrique("Prescription")
  .lit()
  .cellules<Prescription>({
    date_prescription: ({ completedAt }) => jourAParis(completedAt),
  });
