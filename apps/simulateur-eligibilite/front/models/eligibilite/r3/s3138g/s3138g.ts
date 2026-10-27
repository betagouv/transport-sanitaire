// La PMT : la prescription médicale de transport (S3138g, Cerfa 11574*07).
//
// Elle a deux volets, pages 3 et 4, que chaque champ natif porte ensemble. Le
// texte médical et le centre de référence n'ont de champ que sur la page 3, le
// volet médical : rien de médical ne s'écrit sur la page 4.
//
// Elle assemble les rubriques que les cerfa partagent (`../rubriques/`) et
// porte la seule qui lui est propre : la pension militaire. Les noms des
// champs et leurs états d'export sont ceux du gabarit
// (`MAPPING_ACROFORM_GABARITS.json`). Chaque case suit son libellé imprimé.
//
// Ce qu'elle laisse vide :
//
// | Cellules | Pourquoi |
// |---|---|
// | bénéficiaire, organisme, assuré, prescripteur, structure | aucune source fiable (D-74) |
// | `raison sociale VSL`, `adresse VSL`, `fait à`, `date1`, `n° ident` | au transporteur, page 4 |
// | Engagement maternité | « hors remplissage » pour l'éditeur |

import { given } from "../../../../../core/models/eligibilite/question";
import {
  at,
  bindCerfa,
  box,
  type Cerfa,
  type CerfaMapping,
  commentOn,
  date,
  onOneLine,
  templateAt,
  text,
} from "../../../../socle";
import gabarit from "../gabarits/S3138g.pdf?url";
import { ACCIDENT, type Accident } from "../rubriques/accident";
import {
  CENTRE_DE_REFERENCE,
  type CentreDeReference,
} from "../rubriques/centre-de-reference";
import { EXONERATION, type Exoneration } from "../rubriques/exoneration";
import { MODE, type Mode } from "../rubriques/mode";
import { MOTIFS, type Motifs } from "../rubriques/motifs";
import { NOMBRE, type Nombre } from "../rubriques/nombre";
import { PRESCRIPTION, type Prescription } from "../rubriques/prescription";
import type { Rubrique } from "../rubriques/rubrique";
import { TEXTE_MEDICAL, type TexteMedical } from "../rubriques/texte-medical";
import { TRAJET, type Trajet } from "../rubriques/trajet";
import {
  PRECISION_DE_L_URGENCE,
  type PrecisionDeLUrgence,
  URGENCE,
  type Urgence,
} from "../rubriques/urgence";

/**
 * Les soins de pension militaire : Oui s'ils sont établis, Non s'ils sont
 * écartés en Q2.2.1, rien sinon.
 */
type Pension = {
  readonly pension_militaire_oui: boolean;
  readonly pension_militaire_non: boolean;
};

type DtoS3138g = {
  fields: Accident &
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

const CERFA: Cerfa<DtoS3138g> = {
  template: templateAt(gabarit),
  fileName: "prescription-medicale-de-transport",
  fields: {
    tiers_oui: box("oui", "OUI"),
    tiers_non: box("non", "NON"),
    tiers_date: date("date accident"),
    hospitalisation: box("entré sortie hosp", "NON"),
    ald_exo: box("ALD exo", "OUI"),
    ald_non_exo: box("ALD exo", "NON"),
    atmp: box(
      "transport lié à un accident du travail ou une maladie professionnelle",
      "On",
    ),
    atmp_date: date("date accid ATMP"),
    mode_tap_ou_tpmr: box(
      "transport assis professionnalisé VSL taxi conventionné",
      "On",
    ),
    mode_individual: box("transp indiv", "On"),
    mode_public: box("transp terres", "On"),
    ambulance_position_allongee_demi_assise: box(
      "position allongée ou demiassise",
      "On",
    ),
    ambulance_surveillance_constante: box(
      "surveillance par une personne qualifiée",
      "On",
    ),
    ambulance_oxygene: box("dadministration doxygène", "On"),
    ambulance_brancardage_portage: box("brancardage ou dun portage", "On"),
    ambulance_isolement_asepsie: box("aseptie rigoureuse", "On"),
    partage_incompatible: box(
      "létat de santé du patient nest pas compatible avec un transport partagé cochez la case",
      "On",
    ),
    fauteuil: box(
      "un transport pour patient à mobilité réduite dans son fauteuil roulant est adapté cochez la case",
      "On",
    ),
    accompagnant: box(
      "dans ce cas si létat du patient nécessite une personne accompagnante cochez la case",
      "On",
    ),
    depart_domicile: box("domicile", "On"),
    depart_structure: text("départ struct soins"),
    depart_autre: text("départ autre lieu"),
    arrivee_domicile: box("domicile_2", "On"),
    arrivee_structure: text("arrivée struct soins"),
    arrivee_autre: text("arrivée autre lieu"),
    aller_retour: box("transp aller-retour", "On"),
    nombre: text("nbr transp"),
    urgence_appel15: box("Urg SAMU centre 15", "On"),
    urgence_autre: box("autres", "On"),
    elements_medicaux: text("comm évent"),
    elements_medicaux_precision: commentOn("elements_medicaux"),
    centre_rare: box("transp autre cent", "On"),
    exoneration_oui: box("oui1", "OUI"),
    exoneration_non: box("oui1", "NON"),
    pension_militaire_oui: box("oui2", "OUI"),
    pension_militaire_non: box("oui2", "NON"),
    date_prescription: date("date"),
  },
  // À la suite de « autres (précisez) : », jusqu'au cadre, sur chaque volet.
  // Une seconde ligne passerait sur le titre de la rubrique suivante (D-187).
  drawings: {
    urgence_precision: onOneLine(
      at(
        { page: 3, x: 334, y: 322, width: 234 },
        { page: 4, x: 337, y: 322, width: 231 },
      ),
    ),
  },
};

const pension = given.cible("cible_situation_pension_militaire");

const PENSION: Rubrique<Pension> = {
  pension_militaire_oui: pension.isOui(),
  pension_militaire_non: pension.isNon(),
};

// Le DTO de la PMT, rubrique par rubrique.
const VERS_LA_PMT: CerfaMapping<DtoS3138g> = {
  fields: {
    ...ACCIDENT,
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

/** La PMT, liée au calcul de son DTO. */
export const S3138G = bindCerfa(CERFA, VERS_LA_PMT);
