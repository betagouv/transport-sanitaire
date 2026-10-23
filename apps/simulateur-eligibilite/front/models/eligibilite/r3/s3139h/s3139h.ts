// La DAP : la demande d'accord préalable (S3139h, Cerfa 11575*08). Elle sert
// aussi à la demande d'examen d'un transport à l'étranger.
//
// Elle a trois volets, pages 2, 3 et 4, que chaque champ natif porte ensemble.
// Le texte médical et le centre de référence n'ont de champ que sur la page 2,
// le volet médical.
//
// Elle reprend les rubriques de la PMT (`../rubriques/`), sauf ses motifs : la
// DAP a les siens, et la situation d'un transport par avion ou bateau. Les
// noms des champs et leurs états d'export sont ceux du gabarit
// (`MAPPING_ACROFORM_GABARITS.json`). Une case partagée par des cellules qui
// peuvent se cocher ensemble est dessinée (`drawnBox`). Chaque case suit son
// libellé imprimé, et deux champs les inversent (D-188) :
//
// | Champ | État | Libellé imprimé à côté de la case |
// |---|---|---|
// | `rap acc` | `Oui` / `non` | « non » / « oui » de l'accident causé par un tiers |
// | `sit` | `non` / `ald` | « ALD exonérante » / « ALD non exonérante » |
//
// Ce qu'elle laisse vide :
//
// | Cellules | Pourquoi |
// |---|---|
// | bénéficiaire, organisme, assuré, prescripteur, structure | aucune source fiable (D-74) |
// | `acc`, `ac ad`, `motif`, `date avis`, `date avis ad` | à la caisse, pages 2 et 3 |
// | `raison soc`, `adresse`, `num ident`, `fait à`, `date fait` | au transporteur, page 4 |

import {
  bindCerfa,
  box,
  type Cerfa,
  type CerfaMapping,
  commentOn,
  date,
  drawnBox,
  templateAt,
  text,
} from "../../../../socle";
import gabarit from "../gabarits/S3139h.pdf?url";
import { ACCIDENT, type Accident } from "../rubriques/accident";
import {
  AVION_OU_BATEAU,
  type AvionOuBateau,
} from "../rubriques/avion-ou-bateau";
import {
  CENTRE_DE_REFERENCE,
  type CentreDeReference,
} from "../rubriques/centre-de-reference";
import { EXONERATION, type Exoneration } from "../rubriques/exoneration";
import { LIENS, type Liens } from "../rubriques/liens";
import { MODE, type Mode } from "../rubriques/mode";
import {
  MOTIFS_DE_LA_DAP,
  type MotifsDeLaDap,
} from "../rubriques/motifs-de-la-dap";
import { NOMBRE, type Nombre } from "../rubriques/nombre";
import { PRESCRIPTION, type Prescription } from "../rubriques/prescription";
import type { Donnees } from "../rubriques/rubrique";
import { TEXTE_MEDICAL, type TexteMedical } from "../rubriques/texte-medical";
import { TRAJET, type Trajet } from "../rubriques/trajet";
import {
  PRECISION_DE_L_URGENCE,
  type PrecisionDeLUrgence,
  URGENCE,
  type Urgence,
} from "../rubriques/urgence";

type DtoS3139h = {
  fields: Accident &
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

const CERFA: Cerfa<DtoS3139h> = {
  template: templateAt(gabarit),
  fileName: "demande-d-accord-prealable",
  fields: {
    tiers_oui: box("rap acc", "non"),
    tiers_non: box("rap acc", "Oui"),
    tiers_date: date("DATE AT"),
    longue_distance: drawnBox("km", "Oui"),
    serie: drawnBox("km", "non"),
    camsp_cmpp: drawnBox("km", "camsp"),
    engagement_maternite: drawnBox("km", "engag"),
    avion_bateau: box("bat ou av", "Oui"),
    air_accompagnant: box("pers acc", "Oui"),
    air_hospitalisation: drawnBox("sit", "Oui"),
    air_ald_exo: drawnBox("sit", "non"),
    air_ald_non_exo: drawnBox("sit", "ald"),
    air_atmp: drawnBox("sit", "atmp"),
    air_atmp_date: date("dat at"),
    mode_tap_ou_tpmr: box("vsl", "Oui"),
    mode_individual: box("ti", "Oui"),
    mode_public: box("ti", "non"),
    ambulance_position_allongee_demi_assise: box("pos all", "Oui"),
    ambulance_surveillance_constante: box("surv", "Oui"),
    ambulance_oxygene: box("oxy", "Oui"),
    ambulance_brancardage_portage: box("branc", "Oui"),
    ambulance_isolement_asepsie: box("asep", "Oui"),
    partage_incompatible: box("trans part", "Oui"),
    fauteuil: box("faut adapt", "Oui"),
    accompagnant: box("pat acc", "Oui"),
    lien_ald: drawnBox("ald", "Oui"),
    lien_atmp: drawnBox("ald", "non"),
    lien_atmp_date: date("date atmp 2"),
    depart_domicile: box("dép", "Oui"),
    depart_structure: text("struct soins"),
    depart_autre: text("autre lieu"),
    arrivee_domicile: box("arr", "Oui"),
    arrivee_structure: text("struct soins 2"),
    arrivee_autre: text("autre lieu 2"),
    aller_retour: box("alret", "Oui"),
    nombre: text("nom tra"),
    urgence_appel15: box("samu", "Oui"),
    urgence_autre: box("samu", "non"),
    urgence_precision: text("préc"),
    elements_medicaux: text("elmedic"),
    elements_medicaux_precision: commentOn("elements_medicaux"),
    // Le widget n'a pas d'état d'export valide : sa marque est dessinée.
    centre_rare: drawnBox("malrare", "Oui"),
    exoneration_oui: box("ETM", "Oui"),
    exoneration_non: box("ETM", "NON"),
    date_prescription: date("date id"),
  },
  drawings: {},
};

// Le DTO de la DAP, rubrique par rubrique.
const VERS_LA_DAP: CerfaMapping<DtoS3139h, Donnees> = {
  fields: {
    ...ACCIDENT,
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

/** La DAP, liée au calcul de son DTO. */
export const S3139H = bindCerfa(CERFA, VERS_LA_DAP);
