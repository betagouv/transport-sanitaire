// Le S3141 : la prescription de transport d'une permission de sortie, pour un
// patient de moins de 20 ans (Cerfa 3141).
//
// Il assemble les rubriques que les cerfa partagent (`../rubriques/`) et porte
// la seule qui lui est propre : la permission. Les noms des champs et leurs
// états d'export sont ceux du gabarit (`MAPPING_ACROFORM_GABARITS.json`).
//
// Ce qu'il laisse vide :
//
// | Cellules | Pourquoi |
// |---|---|
// | bénéficiaire, assuré, prescripteur, structure | aucune source fiable (D-74) |
// | `adresse`, `dat fait le`, `fait lieu`, `num ident transport`, `pério traj`, `raison sociale` | « hors remplissage » pour l'éditeur |
// | toute rubrique médicale | le S3141 n'en a pas (COR-10) |
//
// La case de l'accident causé par un tiers suit le libellé imprimé, pas
// l'état d'export : le gabarit imprime « non » puis « oui », mais nomme `Oui`
// la case de gauche et `non` celle de droite. Suivre les états cocherait
// « non » pour un accident causé par un tiers (D-139).

import {
  bindCerfa,
  box,
  type Cerfa,
  type CerfaMapping,
  date,
  templateAt,
  text,
} from "../../../../socle";
import gabarit from "../gabarits/S3141.pdf?url";
import { ACCIDENT, type Accident } from "../rubriques/accident";
import { EXONERATION, type Exoneration } from "../rubriques/exoneration";
import { LIENS, type Liens } from "../rubriques/liens";
import { MODE, type Mode } from "../rubriques/mode";
import { PRESCRIPTION, type Prescription } from "../rubriques/prescription";
import { type Donnees, uneRubrique } from "../rubriques/rubrique";
import { TRAJET, type Trajet } from "../rubriques/trajet";

/**
 * La permission : depuis quand le patient est hospitalisé (Q2.8.1), et, pour
 * plusieurs permissions, leur nombre mensuel de trajets (Q3.1.3) et la fin de
 * leur période (Q2.8.6). Une seule permission laisse ces deux-là vides : ce
 * n'est pas une fréquence (D-137).
 */
type Permission = {
  /** `AAAA-MM-JJ`. */
  readonly debut_hospitalisation?: string;
  readonly nombre?: string;
  /** `AAAA-MM-JJ`. */
  readonly periode_fin?: string;
};

type DtoS3141 = {
  fields: Accident &
    Permission &
    Mode &
    Liens &
    Trajet &
    Exoneration &
    Prescription;
  drawings: Record<never, never>;
};

const CERFA: Cerfa<DtoS3141> = {
  template: templateAt(gabarit),
  fileName: "prescription-de-permission-de-sortie",
  fields: {
    tiers_oui: box("rct", "non"),
    tiers_non: box("rct", "Oui"),
    tiers_date: date("date acc"),
    debut_hospitalisation: date("date deb hosp"),
    nombre: text("tr mois"),
    periode_fin: date("dat freq per"),
    mode_tap_ou_tpmr: box("assis", "Oui"),
    mode_individual: box("mt", "Oui"),
    mode_public: box("mt", "non"),
    ambulance_position_allongee_demi_assise: box("all", "Oui"),
    ambulance_surveillance_constante: box("surv", "Oui"),
    ambulance_oxygene: box("oxy", "Oui"),
    ambulance_brancardage_portage: box("branc", "Oui"),
    ambulance_isolement_asepsie: box("asep", "Oui"),
    partage_incompatible: box("partage", "Oui"),
    fauteuil: box("mob réd", "Oui"),
    accompagnant: box("accomp", "Oui"),
    lien_ald: box("ald exo", "Oui"),
    lien_atmp: box("etm", "Oui"),
    lien_atmp_date: date("dat AT/MP"),
    depart_domicile: box("dép dom", "Oui"),
    depart_structure: text("dép struct soin"),
    depart_autre: text("dép aut lieu"),
    arrivee_domicile: box("arr dom", "Oui"),
    arrivee_structure: text("arr struct soin"),
    arrivee_autre: text("arr aut lieu"),
    aller_retour: box("a/r", "Oui"),
    exoneration_oui: box("exo", "Oui"),
    exoneration_non: box("exo", "non"),
    date_prescription: date("dat pmt"),
  },
  drawings: {},
};

export const PERMISSION = uneRubrique("Permission")
  .lit("Q2.8.1", "Q3.1.3", "Q2.8.6")
  .cellules<Permission>({
    debut_hospitalisation: ({ validated }) =>
      validated.question("Q2.8.1").value,
    nombre: ({ validated }) => {
      const nombre = validated.question("Q3.1.3").value;
      return nombre === undefined ? undefined : String(nombre);
    },
    periode_fin: ({ validated }) => validated.question("Q2.8.6").value,
  });

// Le DTO du S3141, rubrique par rubrique.
const VERS_LE_S3141: CerfaMapping<DtoS3141, Donnees> = {
  fields: {
    ...ACCIDENT.cellules,
    ...PERMISSION.cellules,
    ...MODE.cellules,
    ...LIENS.cellules,
    ...TRAJET.cellules,
    ...EXONERATION.cellules,
    ...PRESCRIPTION.cellules,
  },
  drawings: {},
};

/** Le S3141, lié au calcul de son DTO. */
export const S3141 = bindCerfa(CERFA, VERS_LE_S3141);
