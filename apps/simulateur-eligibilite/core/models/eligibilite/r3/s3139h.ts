// La DAP : ce que dit la demande d'accord préalable (S3139h, Cerfa 11575*08).
// Elle sert aussi à la demande d'examen d'un transport à l'étranger. Où chaque
// entrée s'écrit dans le gabarit est dans `front/models/eligibilite/r3/s3139h/`.
//
// Elle reprend les rubriques de la PMT (`rubriques/`), sauf ses motifs : la
// DAP a les siens, et la situation d'un transport par avion ou bateau.

import type { CerfaMapping } from "../../../socle/index.ts";
import { ACCIDENT, type Accident } from "./rubriques/accident.ts";
import {
  AVION_OU_BATEAU,
  type AvionOuBateau,
} from "./rubriques/avion-ou-bateau.ts";
import { BENEFICIAIRE, type Beneficiaire } from "./rubriques/beneficiaire.ts";
import {
  CENTRE_DE_REFERENCE,
  type CentreDeReference,
} from "./rubriques/centre-de-reference.ts";
import { EXONERATION, type Exoneration } from "./rubriques/exoneration.ts";
import { LIENS, type Liens } from "./rubriques/liens.ts";
import { MODE, type Mode } from "./rubriques/mode.ts";
import {
  MOTIFS_DE_LA_DAP,
  type MotifsDeLaDap,
} from "./rubriques/motifs-de-la-dap.ts";
import { NOMBRE, type Nombre } from "./rubriques/nombre.ts";
import { PRESCRIPTION, type Prescription } from "./rubriques/prescription.ts";
import { TEXTE_MEDICAL, type TexteMedical } from "./rubriques/texte-medical.ts";
import { TRAJET, type Trajet } from "./rubriques/trajet.ts";
import {
  PRECISION_DE_L_URGENCE,
  type PrecisionDeLUrgence,
  URGENCE,
  type Urgence,
} from "./rubriques/urgence.ts";

export type DtoS3139h = {
  fields: Accident &
    Beneficiaire &
    MotifsDeLaDap &
    AvionOuBateau &
    Mode &
    Liens &
    Trajet &
    Nombre &
    Urgence &
    PrecisionDeLUrgence &
    TexteMedical &
    CentreDeReference &
    Exoneration &
    Prescription;
  drawings: Record<never, never>;
};

// Le DTO de la DAP, rubrique par rubrique.
export const VERS_LA_DAP: CerfaMapping<DtoS3139h> = {
  fields: {
    ...ACCIDENT,
    ...BENEFICIAIRE,
    ...MOTIFS_DE_LA_DAP,
    ...AVION_OU_BATEAU,
    ...MODE,
    ...LIENS,
    ...TRAJET,
    ...NOMBRE,
    ...URGENCE,
    ...PRECISION_DE_L_URGENCE,
    ...TEXTE_MEDICAL,
    ...CENTRE_DE_REFERENCE,
    ...EXONERATION,
    ...PRESCRIPTION,
  },
  drawings: {},
};
