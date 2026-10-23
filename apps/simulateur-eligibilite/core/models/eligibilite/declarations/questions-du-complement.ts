// Les questions de P3, le complément du cerfa, et le type de leur réponse.

import type { Address } from "../../../socle/index.ts";
import type { OPTIONS_DU_COMPLEMENT } from "./options-du-complement.ts";

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
  /** Les précisions du soin, et la raison d'un lieu éloigné. */
  "Q3.4": string;
  "Q3.4.distance": string;
  "Q3.4.a": Option<"Q3.4.a">;
  /** La nature de l'urgence médicale attestée. */
  "Q3.5": string;
  /** La date AT/MP, puis l'accident causé par un tiers et sa date. */
  "Q3.6.1": string;
  "Q3.6.2": Option<"Q3.6.2">;
  "Q3.6.3": string;
  /** Les cas particuliers d'exonération du ticket modérateur. */
  "Q3.7": Option<"Q3.7">[];
};
