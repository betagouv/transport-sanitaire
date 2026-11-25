// La PMT : ce que dit la prescription médicale de transport (S3138g, Cerfa
// 11574*07). Où chaque entrée s'écrit dans le gabarit est dans
// `front/models/eligibilite/r3/s3138g/`.
//
// Elle assemble les rubriques que les cerfa partagent (`rubriques/`) et porte
// la seule qui lui est propre : la pension militaire. La précision de
// l'urgence est un dessin de son cerfa : le gabarit n'a pas de champ pour elle.

import type { CerfaMapping } from "../../../socle/index.ts";
import { given } from "../questions/reponses.ts";
import { ACCIDENT, type Accident } from "./rubriques/accident.ts";
import { BENEFICIAIRE, type Beneficiaire } from "./rubriques/beneficiaire.ts";
import {
  CENTRE_DE_REFERENCE,
  type CentreDeReference,
} from "./rubriques/centre-de-reference.ts";
import { EXONERATION, type Exoneration } from "./rubriques/exoneration.ts";
import { MODE, type Mode } from "./rubriques/mode.ts";
import { MOTIFS, type Motifs } from "./rubriques/motifs.ts";
import { NOMBRE, type Nombre } from "./rubriques/nombre.ts";
import { PRESCRIPTION, type Prescription } from "./rubriques/prescription.ts";
import type { Rubrique } from "./rubriques/rubrique.ts";
import { TEXTE_MEDICAL, type TexteMedical } from "./rubriques/texte-medical.ts";
import { TRAJET, type Trajet } from "./rubriques/trajet.ts";
import {
  PRECISION_DE_L_URGENCE,
  type PrecisionDeLUrgence,
  URGENCE,
  type Urgence,
} from "./rubriques/urgence.ts";

/**
 * Les soins de pension militaire : Oui s'ils sont établis, Non s'ils sont
 * écartés en Q2.2.1, rien sinon.
 */
type Pension = {
  readonly pension_militaire_oui: boolean;
  readonly pension_militaire_non: boolean;
};

export type DtoS3138g = {
  fields: Accident &
    Beneficiaire &
    Motifs &
    Mode &
    Trajet &
    Nombre &
    Urgence &
    TexteMedical &
    CentreDeReference &
    Exoneration &
    Pension &
    Prescription;
  drawings: PrecisionDeLUrgence;
};

const pension = given.cible("cible_situation_pension_militaire");

const PENSION: Rubrique<Pension> = {
  pension_militaire_oui: pension.isOui(),
  pension_militaire_non: pension.isNon(),
};

// Le DTO de la PMT, rubrique par rubrique.
export const VERS_LA_PMT: CerfaMapping<DtoS3138g> = {
  fields: {
    ...ACCIDENT,
    ...BENEFICIAIRE,
    ...MOTIFS,
    ...MODE,
    ...TRAJET,
    ...NOMBRE,
    ...URGENCE,
    ...TEXTE_MEDICAL,
    ...CENTRE_DE_REFERENCE,
    ...EXONERATION,
    ...PENSION,
    ...PRESCRIPTION,
  },
  drawings: { ...PRECISION_DE_L_URGENCE },
};
