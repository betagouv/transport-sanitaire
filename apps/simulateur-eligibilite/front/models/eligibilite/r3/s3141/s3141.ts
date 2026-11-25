// Le S3141 côté écran : où chaque entrée de son DTO va dans le gabarit de la
// prescription de transport d'une permission de sortie, pour un patient de
// moins de 20 ans (Cerfa 3141). Ce que vaut chaque entrée est dans
// `core/models/eligibilite/r3/s3141.ts`.
//
// Les noms des champs et leurs états d'export sont ceux du gabarit
// (`MAPPING_ACROFORM_GABARITS.json`).
//
// Ce qu'il laisse vide :
//
// | Cellules | Pourquoi |
// |---|---|
// | bénéficiaire hors son adresse, assuré, prescripteur, structure | aucune source fiable |
// | `adresse`, `dat fait le`, `fait lieu`, `num ident transport`, `pério traj`, `raison sociale` | « hors remplissage » pour l'éditeur |
// | toute rubrique médicale | le S3141 n'en a pas (COR-10) |
//
// La case de l'accident causé par un tiers suit le libellé imprimé, pas
// l'état d'export : le gabarit imprime « non » puis « oui », mais nomme `Oui`
// la case de gauche et `non` celle de droite. Suivre les états cocherait
// « non » pour un accident causé par un tiers. L'éditeur renomme
// plutôt les états dans sa copie (`remplir-tiers-s3141.mjs`) ; le cerfa sort
// aplati, et seule la case visible compte.

import type { DtoS3141 } from "../../../../../core/models/eligibilite/r3/s3141";
import {
  type Cerfa,
  CerfaFactory,
  type TypographicFieldId,
  templateAt,
} from "../../../../socle";
import gabarit from "../gabarits/S3141.pdf?url";

const { box, date, text } = CerfaFactory;

/** Le S3141, où chaque entrée de son DTO s'écrit. */
export const S3141: Cerfa<DtoS3141> = {
  template: templateAt(gabarit),
  fileName: "prescription-de-permission-de-sortie",
  fields: {
    tiers_oui: box("rct", "non"),
    tiers_non: box("rct", "Oui"),
    beneficiaire_adresse: text("adress ben"),
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
  // Les identifiants de `champs-typographiques.json` (ANA22-03) : les deux
  // parties d'une extrémité sont son adresse native.
  typographicIds: {
    beneficiaire_adresse: "S3141.beneficiaire_adresse",
    tiers_date: "S3141.tiers_date",
    debut_hospitalisation: "S3141.debut_hospitalisation",
    nombre: "S3141.nombre",
    periode_fin: "S3141.periode_fin",
    lien_atmp_date: "S3141.lien_atmp_date",
    depart_structure: "S3141.depart_adresse_native",
    depart_autre: "S3141.depart_adresse_native",
    arrivee_structure: "S3141.arrivee_adresse_native",
    arrivee_autre: "S3141.arrivee_adresse_native",
    date_prescription: "S3141.date_prescription",
  } satisfies Record<string, TypographicFieldId<"S3141">>,
};
