// La PMT côté écran : où chaque entrée de son DTO va dans le gabarit de la
// prescription médicale de transport (S3138g, Cerfa 11574*07). Ce que vaut
// chaque entrée est dans `core/models/eligibilite/r3/s3138g.ts`.
//
// Elle a deux volets, pages 3 et 4, que chaque champ natif porte ensemble. Le
// texte médical et le centre de référence n'ont de champ que sur la page 3, le
// volet médical : rien de médical ne s'écrit sur la page 4.
//
// Les noms des champs et leurs états d'export sont ceux du gabarit
// (`MAPPING_ACROFORM_GABARITS.json`). Chaque case suit son libellé imprimé.
//
// Ce qu'elle laisse vide :
//
// | Cellules | Pourquoi |
// |---|---|
// | bénéficiaire hors son adresse, organisme, assuré, prescripteur, structure | aucune source fiable |
// | `raison sociale VSL`, `adresse VSL`, `fait à`, `date1`, `n° ident` | au transporteur, page 4 |
// | Engagement maternité | « hors remplissage » pour l'éditeur |

import type { DtoS3138g } from "../../../../../core/models/eligibilite/r3/s3138g";
import {
  type Cerfa,
  CerfaFactory,
  type TypographicFieldId,
  templateAt,
} from "../../../../socle";
import gabarit from "../gabarits/S3138g.pdf?url";
import {
  LIBELLE_DE_LA_PRECISION,
  PRECISION_STRICTE,
} from "../rubriques/urgence";

const { at, box, date, strictText, text, strictDrawing } = CerfaFactory;

/** La PMT, où chaque entrée de son DTO s'écrit. */
export const S3138G: Cerfa<DtoS3138g> = {
  template: templateAt(gabarit),
  fileName: "prescription-medicale-de-transport",
  fields: {
    tiers_oui: box("oui", "OUI"),
    tiers_non: box("non", "NON"),
    beneficiaire_adresse: text("adresse"),
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
    elements_medicaux: strictText(
      "comm évent",
      "Éléments d’ordre médical et commentaires",
    ),
    centre_rare: box("transp autre cent", "On"),
    exoneration_oui: box("oui1", "OUI"),
    exoneration_non: box("oui1", "NON"),
    pension_militaire_oui: box("oui2", "OUI"),
    pension_militaire_non: box("oui2", "NON"),
    date_prescription: date("date"),
  },
  // À la suite de « autres (précisez) : », sur chaque volet. Une seconde ligne
  // passerait sur le titre de la rubrique suivante. La place est celle
  // que l'éditeur mesure : 220 points, moins un point de marge de chaque côté
  // (`urgence-document.mjs`).
  drawings: {
    urgence_precision: strictDrawing(
      at(
        { page: 3, x: 334, y: 322, width: 218 },
        { page: 4, x: 337, y: 322, width: 218 },
      ),
      LIBELLE_DE_LA_PRECISION,
      PRECISION_STRICTE,
    ),
  },
  // Les identifiants de `champs-typographiques.json` (ANA22-03) : les deux
  // parties d'une extrémité sont son adresse native.
  typographicIds: {
    beneficiaire_adresse: "S3138g.beneficiaire_adresse",
    tiers_date: "S3138g.tiers_date",
    atmp_date: "S3138g.atmp_date",
    depart_structure: "S3138g.depart_adresse_native",
    depart_autre: "S3138g.depart_adresse_native",
    arrivee_structure: "S3138g.arrivee_adresse_native",
    arrivee_autre: "S3138g.arrivee_adresse_native",
    nombre: "S3138g.nombre",
    urgence_precision: "S3138g.urgence_precision",
    elements_medicaux: "S3138g.elements_medicaux",
    date_prescription: "S3138g.date_prescription",
  } satisfies Record<string, TypographicFieldId<"S3138g">>,
};
