// Les faits du modèle : ce que ses règles reçoivent, sous le nom que l'éditeur
// leur donne. Tous valent « oui » ou « non », quand ils sont établis.
//
// La liste suit l'ordre des règles. `tests/model/eligibilite/declarations.test.ts`
// la compare à `rules/regles.publicodes`.

import type {
  Fait,
  FaitContext,
  FaitDeclarations,
} from "../../../socle/index.ts";
import type { Questions } from "./questions.ts";

/** Le nom de chaque fait que les règles reçoivent. */
export const FAITS = [
  "fait_p1_complete",
  "fait_p2_complete",
  "fait_autonomie_professionnel",
  "fait_critere_allonge",
  "fait_critere_brancard",
  "fait_critere_surveillance",
  "fait_critere_oxygene",
  "fait_critere_asepsie",
  "fait_critere_fauteuil",
  "fait_critere_tap",
  "fait_partage_incompatible",
  "fait_bariatrique",
  "fait_accompagnant",
  "fait_prefere_transport_commun",
  "fait_source_officielle_active",
  "fait_correspondance_univoque",
  "fait_conditions_soin_verifiees",
  "fait_regime_verifie",
  "fait_situation_soins_qualifiante",
  "fait_exclusion_soin_prouvee",
  "fait_exclusion_transport_prouvee",
  "fait_preuve_prescripteur_qualifiante",
  "fait_preuve_prestation_absente",
  "fait_prestation_non_couverte_declaree",
  "fait_evenement_sans_soin",
  "fait_hospitalisation",
  "fait_atmp_lie",
  "fait_ald_liee",
  "fait_ald_exonerante_3_ou_4",
  "fait_mineur_soins_prolonges_reconnus",
  "fait_mineur_soins_prolonges_a_verifier",
  "fait_motif_camsp",
  "fait_motif_samsah",
  "fait_motif_pension",
  "fait_distance_plus_50",
  "fait_distance_plus_150",
  "fait_serie_qualifiante",
  "fait_avion_bateau_ligne",
  "fait_centre_reference_destination",
  "fait_appel_centre15",
  "fait_dap_maternite",
  "fait_urgence_attestee",
  "fait_urgence_repondue",
  "fait_transfert_article80",
  "fait_exception_article80_admission_sans_sejour",
  "fait_exception_article80_air_mer",
  "fait_exception_article80_had_intercurrent",
  "fait_exception_article80_usld",
  "fait_exception_article80_ehpad",
  "fait_exception_article80_radiotherapie",
  "fait_exception_article80_dialyse_domicile",
  "fait_exception_article80_admission_had",
  "fait_centre15_interetablissements",
  "fait_htnm_hors_maternite",
  "fait_htnm_segment_verifie",
  "fait_permission",
  "fait_permission_mineur_admissible",
  "fait_permission_charge_patient",
  "fait_convocation",
  "fait_trajet_etranger",
] as const;

/**
 * Ce qu'on sait de chaque fait. Un fait absent n'est pas transmis aux règles
 * (D-77) : ce qui en dépend reste indéfini.
 */
export type Faits = Readonly<Record<(typeof FAITS)[number], Fait>>;

/** Des déclarations de faits, par thème, que `faits/index.ts` réunit. */
export type DeclarationsDeFaits = FaitDeclarations<Questions, Faits>;

/**
 * La déclaration d'un fait, dans son fichier de `faits/` : ce qu'il vaut, lu
 * sur les réponses et, au besoin, sur d'autres faits.
 */
export type DeclarationDeFait = (
  context: FaitContext<Questions, Faits>,
) => Fait;

/** La provenance d'un fait qu'aucune question posée n'établit encore. */
export const PAS_ENCORE_ETABLI = "Aucune question posée ne l'établit encore.";

/** La provenance d'une complétude : la décision l'impose, aucune garde ne la lit. */
export const IMPOSEE_PAR_LA_DECISION =
  "Une garde ne la lit pas : la constater pose les questions ; la décision l'impose.";

/**
 * La provenance des faits de la prestation qu'aucune question ne pose : les
 * sous-questions qui les poseraient ne changent aucune sortie (D-102).
 */
export const SOUS_QUESTIONS_MASQUEES =
  "Aucune question ne le pose : les sous-questions a à e et i à l de Q2.1, et le régime, restent masquées (D-102).";
