// Les cibles du modèle : ce que ses règles calculent des faits, sous le nom que
// l'éditeur leur donne. Ce sont elles qui font la préconisation.
//
// Les listes suivent l'ordre des règles. `tests/model/eligibilite/declarations.test.ts`
// les compare à `rules/regles.publicodes`.

import type { Cible } from "../../../socle/index.ts";

/** Les cibles qui valent une constante, et les constantes que chacune peut valoir. */
export const CIBLES_ENUMEREES = {
  cible_mode_id: [
    "AMBULANCE",
    "TPMR",
    "TAP",
    "TRANSPORT_COMMUN",
    "VEHICULE_PERSONNEL",
  ],
  cible_care_status: [
    "SANS_OBJET_SOIN",
    "NON_COUVERTE_PROUVEE",
    "COUVERTE",
    "INDETERMINEE",
  ],
  cible_issue_id: [
    "ISSUE_NON_ELIGIBLE",
    "ISSUE_CAISSE",
    "ISSUE_ETABLISSEMENT",
    "ISSUE_PERMISSION_PATIENT",
    "ISSUE_S3141",
    "ISSUE_DAP_ETRANGER_A_EXAMINER",
    "ISSUE_DAP_URGENCE_ATTESTEE",
    "ISSUE_DAP_SANS_URGENCE",
    "ISSUE_CONVOCATION",
    "ISSUE_PMT",
  ],
  cible_support_id: ["S3138g", "S3139h", "S3141", "AUCUN"],
  cible_financeur: [
    "ETABLISSEMENT",
    "PATIENT",
    "NON_CONCLU",
    "ASSURANCE_MALADIE",
  ],
  cible_reason_code: [
    "DIALYSE_TYPE_NON_VERIFIABLE",
    "TRANSPORT_EXCLU_PROUVE",
    "SOIN_NON_COUVERT_PROUVE",
    "NON_COUVERTE_DECLAREE",
    "PREUVE_PRESTATION_ABSENTE",
    "TRANSPORT_ETRANGER_EXAMEN_CAISSE",
    "ALD_BASE_NON_VERIFIABLE",
    "MINEUR_RECONNAISSANCE_NON_VERIFIABLE",
    "CONVOCATION_CONDITION_NON_VERIFIABLE",
    "AUTRE_DROIT_NON_VERIFIABLE",
    "SAMSAH_DAP_SUPPORT_A_QUALIFIER",
    "PENSION_MILITAIRE_ACCORD_CIRCUIT_A_QUALIFIER",
    "CNAM_CENTRE15_INTERETABLISSEMENT",
    "CNAM_HTNM_HORS_MATERNITE",
    "DAP_AUTONOME_URGENCE_NON_VERIFIEE",
    "CNAM_ENGAGEMENT_MATERNITE_URGENCE",
    "SOINS_NON_VERIFIABLES",
    "AUCUN_MOTIF_TRANSPORT",
    "ARTICLE80_ETABLISSEMENT",
    "PERMISSION_MINEUR",
    "MOTIF_QUALIFIE",
  ],
} as const;

/** Les cibles qui valent « oui » ou « non ». */
const CIBLES_BOOLEENNES = [
  "cible_mode_ambulance",
  "cible_ambulance_equipement_bariatrique",
  "cible_mode_coherent",
  "cible_qualification_soin_decisive_transport",
  "cible_autre_motif_ald",
  "cible_autre_motif_hors_mineur",
  "cible_convocation_inconnue_decisive",
  "cible_preuve_ald_inconnue_decisive",
  "cible_reconnaissance_mineur_inconnue_decisive",
  "cible_couverture_inconnue_decisive",
  "cible_ald_qualifiante",
  "cible_mineur_soins_prolonges",
  "cible_serie",
  "cible_exception_article80",
  "cible_motif_transport",
  "cible_dap_motif_longue_distance",
  "cible_dap_motif_serie",
  "cible_dap_motif_avion_bateau",
  "cible_dap_motif_camsp_cmpp",
  "cible_dap_motif_engagement_maternite",
  "cible_dap_requise",
  "cible_dap_fondement_autonome",
  "cible_point_cnam",
  "cible_orientation_sans_urgence_deja_etablie",
  "cible_question_urgence_a_afficher",
  "cible_question_urgence_requise",
  "cible_decision_calculable",
  "cible_urgence_attestee",
  "cible_reponse_explicite_caisse",
  "cible_attente_accord",
  "cible_mode_tap_ou_tpmr",
  "cible_mode_individual",
  "cible_mode_public",
  "cible_ambulance_position_allongee_demi_assise",
  "cible_ambulance_brancardage_portage",
  "cible_ambulance_surveillance_constante",
  "cible_ambulance_oxygene",
  "cible_ambulance_isolement_asepsie",
  "cible_fauteuil_roulant",
  "cible_transport_partage_incompatible",
  "cible_personne_accompagnante",
  "cible_ald_juridiquement_qualifiante_3_ou_4_degres",
  "cible_mineur_ald_non_exonerante_reconnue",
  "cible_hospitalisation_ou_seances_assimilees",
  "cible_situation_at_mp",
  "cible_situation_pension_militaire",
  "cible_centre_reference_destination_reelle",
  "cible_urgence_appel15",
  "cible_urgence_autre",
  "cible_autre_fondement_dialyse_etabli",
  "cible_incertitude_dialyse_decisive",
] as const;

type CibleEnumeree = keyof typeof CIBLES_ENUMEREES;

/**
 * Ce que les règles donnent pour des faits : chaque cible, « oui ou non » ou à
 * constantes. Sans objet ou inconnue, elle n'est pas une décision.
 */
export type Cibles = Readonly<
  Record<(typeof CIBLES_BOOLEENNES)[number], Cible<boolean>> & {
    [Nom in CibleEnumeree]: Cible<(typeof CIBLES_ENUMEREES)[Nom][number]>;
  }
>;

/** Le nom de chaque cible que les règles calculent. */
export const CIBLES: readonly (keyof Cibles)[] = [
  ...CIBLES_BOOLEENNES,
  ...(Object.keys(CIBLES_ENUMEREES) as CibleEnumeree[]),
];
