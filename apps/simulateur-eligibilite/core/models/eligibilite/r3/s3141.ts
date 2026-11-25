// Le S3141 : ce que dit la prescription de transport d'une permission de
// sortie, pour un patient de moins de 20 ans (Cerfa 3141). Où chaque entrée
// s'écrit dans le gabarit est dans `front/models/eligibilite/r3/s3141/`.
//
// Il assemble les rubriques que les cerfa partagent (`rubriques/`) et porte la
// seule qui lui est propre : la permission. Le S3141 n'a aucune rubrique
// médicale (COR-10).
//
// La case de l'accident causé par un tiers suit le libellé imprimé, pas
// l'état d'export du gabarit : voir le cerfa.

import type { CerfaMapping } from "../../../socle/index.ts";
import { given } from "../questions/reponses.ts";
import { ACCIDENT, type Accident } from "./rubriques/accident.ts";
import { BENEFICIAIRE, type Beneficiaire } from "./rubriques/beneficiaire.ts";
import { EXONERATION, type Exoneration } from "./rubriques/exoneration.ts";
import { LIENS, type Liens } from "./rubriques/liens.ts";
import { MODE, type Mode } from "./rubriques/mode.ts";
import { PRESCRIPTION, type Prescription } from "./rubriques/prescription.ts";
import type { Rubrique } from "./rubriques/rubrique.ts";
import { TRAJET, type Trajet } from "./rubriques/trajet.ts";

/**
 * La permission : depuis quand le patient est hospitalisé (Q2.8.1), et, pour
 * plusieurs permissions, leur nombre mensuel de trajets (Q3.1.3) et la fin de
 * leur période (Q2.8.6). Une seule permission laisse ces deux-là vides : ce
 * n'est pas une fréquence.
 */
type Permission = {
  /** `AAAA-MM-JJ`. */
  readonly debut_hospitalisation?: string;
  readonly nombre?: string;
  /** `AAAA-MM-JJ`. */
  readonly periode_fin?: string;
};

export type DtoS3141 = {
  fields: Accident &
    Beneficiaire &
    Permission &
    Mode &
    Liens &
    Trajet &
    Exoneration &
    Prescription;
  drawings: Record<never, never>;
};

const PERMISSION: Rubrique<Permission> = {
  debut_hospitalisation: given
    .question("Q2.8.1")
    .answer()
    .compute(({ value }) => value),
  nombre: given
    .question("Q3.1.3")
    .answer()
    .compute(({ value }) => (value === undefined ? undefined : String(value))),
  periode_fin: given
    .question("Q2.8.6")
    .answer()
    .compute(({ value }) => value),
};

// Le DTO du S3141, rubrique par rubrique.
export const VERS_LE_S3141: CerfaMapping<DtoS3141> = {
  fields: {
    ...ACCIDENT,
    ...BENEFICIAIRE,
    ...PERMISSION,
    ...MODE,
    ...LIENS,
    ...TRAJET,
    ...EXONERATION,
    ...PRESCRIPTION,
  },
  drawings: {},
};
