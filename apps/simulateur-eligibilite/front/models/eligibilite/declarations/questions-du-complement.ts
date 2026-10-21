// Les questions de P3, le complément du cerfa, et le type de leur réponse.

import type { Address } from "../../../socle";
import type { OPTIONS_DU_COMPLEMENT } from "./options-du-complement";

type Option<Id extends keyof typeof OPTIONS_DU_COMPLEMENT> =
  keyof (typeof OPTIONS_DU_COMPLEMENT)[Id];

export type QuestionsDuComplement = {
  /** Les transports de ce document (PMT, DAP), puis leur sens. */
  "Q3.1.1": number;
  "Q3.1.2": Option<"Q3.1.2">;
  /** Les trajets par mois du S3141. */
  "Q3.1.3": number;
  /**
   * Le départ : sa nature, si P2 ne l'établit pas, son nom, sa nature en
   * toutes lettres pour un hébergement ou un autre lieu, son adresse.
   */
  "Q3.2.nature": Option<"Q3.2.nature">;
  "Q3.2.nom": string;
  "Q3.2.precision": string;
  "Q3.2.adresse": Address;
  /** L'arrivée, de même. */
  "Q3.3.nature": Option<"Q3.3.nature">;
  "Q3.3.nom": string;
  "Q3.3.precision": string;
  "Q3.3.adresse": Address;
};
