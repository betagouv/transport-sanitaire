// Le catalogue des faits du modèle : un fichier par fait, qui porte son nom
// sans `fait_`. Chaque fichier dit tout ce que vaut son fait, la première règle
// qui conclut l'emporte. Ce que plusieurs faits lisent est un concept.
//
// Chaque fait suit `CONTRAT_REPONSES_FAITS.json` du paquet de l'éditeur, ou
// `CORRECTIF_FAITS_SANS_REPONSE.md` quand ce correctif le reprend : ce qui le
// met à « oui », ce qui le met à « non », et ce qui le laisse absent. Il ne lit
// que les questions validées.
//
// Les gardes des questions lisent ce catalogue. La décision le lit aussi, en
// imposant la complétude de P1 et de P2 : la constater pose les questions,
// donc lit leurs gardes.

import { FaitCatalogue } from "../../../socle/index.ts";
import { FAITS, type Faits } from "../declarations/faits.ts";
import type { Questions } from "../declarations/questions.ts";
import { FAITS_DE_LA_PERMISSION } from "../p2/permission.ts";
import { FAITS_DU_TRAJET } from "../p2/trajet.ts";
import { accompagnant } from "./accompagnant.ts";
import { aldExonerante3Ou4 } from "./ald-exonerante-3-ou-4.ts";
import { aldLiee } from "./ald-liee.ts";
import { appelCentre15 } from "./appel-centre15.ts";
import { atmpLie } from "./atmp-lie.ts";
import { autonomieProfessionnel } from "./autonomie-professionnel.ts";
import { bariatrique } from "./bariatrique.ts";
import { centreReferenceDestination } from "./centre-reference-destination.ts";
import { centre15Interetablissements } from "./centre15-interetablissements.ts";
import { conditionsSoinVerifiees } from "./conditions-soin-verifiees.ts";
import { convocation } from "./convocation.ts";
import { correspondanceUnivoque } from "./correspondance-univoque.ts";
import { critereAllonge } from "./critere-allonge.ts";
import { critereAsepsie } from "./critere-asepsie.ts";
import { critereBrancard } from "./critere-brancard.ts";
import { critereFauteuil } from "./critere-fauteuil.ts";
import { critereOxygene } from "./critere-oxygene.ts";
import { critereSurveillance } from "./critere-surveillance.ts";
import { critereTap } from "./critere-tap.ts";
import { dapMaternite } from "./dap-maternite.ts";
import { evenementSansSoin } from "./evenement-sans-soin.ts";
import { exceptionArticle80AdmissionHad } from "./exception-article80-admission-had.ts";
import { exceptionArticle80AdmissionSansSejour } from "./exception-article80-admission-sans-sejour.ts";
import { exceptionArticle80AirMer } from "./exception-article80-air-mer.ts";
import { exceptionArticle80DialyseDomicile } from "./exception-article80-dialyse-domicile.ts";
import { exceptionArticle80Ehpad } from "./exception-article80-ehpad.ts";
import { exceptionArticle80HadIntercurrent } from "./exception-article80-had-intercurrent.ts";
import { exceptionArticle80Radiotherapie } from "./exception-article80-radiotherapie.ts";
import { exceptionArticle80Usld } from "./exception-article80-usld.ts";
import { exclusionSoinProuvee } from "./exclusion-soin-prouvee.ts";
import { exclusionTransportProuvee } from "./exclusion-transport-prouvee.ts";
import { hospitalisation } from "./hospitalisation.ts";
import { htnmHorsMaternite } from "./htnm-hors-maternite.ts";
import { htnmSegmentVerifie } from "./htnm-segment-verifie.ts";
import { mineurSoinsProlongesAVerifier } from "./mineur-soins-prolonges-a-verifier.ts";
import { mineurSoinsProlongesReconnus } from "./mineur-soins-prolonges-reconnus.ts";
import { motifCamsp } from "./motif-camsp.ts";
import { motifPension } from "./motif-pension.ts";
import { motifSamsah } from "./motif-samsah.ts";
import { p1Complete } from "./p1-complete.ts";
import { p2Complete } from "./p2-complete.ts";
import { partageIncompatible } from "./partage-incompatible.ts";
import { prefereTransportCommun } from "./prefere-transport-commun.ts";
import { prestationNonCouverteDeclaree } from "./prestation-non-couverte-declaree.ts";
import { preuvePrescripteurQualifiante } from "./preuve-prescripteur-qualifiante.ts";
import { preuvePrestationAbsente } from "./preuve-prestation-absente.ts";
import { regimeVerifie } from "./regime-verifie.ts";
import { situationSoinsQualifiante } from "./situation-soins-qualifiante.ts";
import { sourceOfficielleActive } from "./source-officielle-active.ts";
import { trajetEtranger } from "./trajet-etranger.ts";
import { transfertArticle80 } from "./transfert-article80.ts";

/** Les faits du modèle, chacun déclaré une fois. */
export const CATALOGUE_DES_FAITS = new FaitCatalogue<Questions, Faits>(
  FAITS,
  {
    fait_p1_complete: p1Complete,
    fait_p2_complete: p2Complete,
    fait_source_officielle_active: sourceOfficielleActive,
    fait_correspondance_univoque: correspondanceUnivoque,
    fait_conditions_soin_verifiees: conditionsSoinVerifiees,
    fait_regime_verifie: regimeVerifie,
    fait_exclusion_soin_prouvee: exclusionSoinProuvee,
    fait_exclusion_transport_prouvee: exclusionTransportProuvee,
    fait_preuve_prescripteur_qualifiante: preuvePrescripteurQualifiante,
    fait_preuve_prestation_absente: preuvePrestationAbsente,
    fait_prestation_non_couverte_declaree: prestationNonCouverteDeclaree,
    fait_mineur_soins_prolonges_a_verifier: mineurSoinsProlongesAVerifier,
    fait_centre_reference_destination: centreReferenceDestination,
    fait_autonomie_professionnel: autonomieProfessionnel,
    fait_critere_allonge: critereAllonge,
    fait_critere_brancard: critereBrancard,
    fait_critere_surveillance: critereSurveillance,
    fait_critere_oxygene: critereOxygene,
    fait_critere_asepsie: critereAsepsie,
    fait_critere_fauteuil: critereFauteuil,
    fait_critere_tap: critereTap,
    fait_partage_incompatible: partageIncompatible,
    fait_bariatrique: bariatrique,
    fait_accompagnant: accompagnant,
    fait_prefere_transport_commun: prefereTransportCommun,
    fait_ald_liee: aldLiee,
    fait_ald_exonerante_3_ou_4: aldExonerante3Ou4,
    fait_mineur_soins_prolonges_reconnus: mineurSoinsProlongesReconnus,
    fait_evenement_sans_soin: evenementSansSoin,
    fait_motif_camsp: motifCamsp,
    fait_situation_soins_qualifiante: situationSoinsQualifiante,
    fait_hospitalisation: hospitalisation,
    fait_trajet_etranger: trajetEtranger,
    fait_atmp_lie: atmpLie,
    fait_motif_samsah: motifSamsah,
    fait_motif_pension: motifPension,
    fait_htnm_hors_maternite: htnmHorsMaternite,
    fait_htnm_segment_verifie: htnmSegmentVerifie,
    fait_dap_maternite: dapMaternite,
    fait_convocation: convocation,
    fait_transfert_article80: transfertArticle80,
    fait_centre15_interetablissements: centre15Interetablissements,
    fait_appel_centre15: appelCentre15,
    fait_exception_article80_admission_sans_sejour:
      exceptionArticle80AdmissionSansSejour,
    fait_exception_article80_air_mer: exceptionArticle80AirMer,
    fait_exception_article80_had_intercurrent:
      exceptionArticle80HadIntercurrent,
    fait_exception_article80_usld: exceptionArticle80Usld,
    fait_exception_article80_ehpad: exceptionArticle80Ehpad,
    fait_exception_article80_radiotherapie: exceptionArticle80Radiotherapie,
    fait_exception_article80_dialyse_domicile:
      exceptionArticle80DialyseDomicile,
    fait_exception_article80_admission_had: exceptionArticle80AdmissionHad,
  },
  FAITS_DU_TRAJET,
  FAITS_DE_LA_PERMISSION,
);
