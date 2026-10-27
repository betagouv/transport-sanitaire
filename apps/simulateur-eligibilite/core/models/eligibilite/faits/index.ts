// Le catalogue des faits du modèle : un fichier par fait, qui porte son nom
// sans `fait_`. Chaque fichier écrit les règles de son fait, la première qui
// l'établit l'emporte. Ce que plusieurs faits lisent à l'identique se nomme
// dans `communs.ts`.
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
import { accompagnant } from "./accompagnant.ts";
import { aldExonerante3Ou4 } from "./ald-exonerante-3-ou-4.ts";
import { aldLiee } from "./ald-liee.ts";
import { appelCentre15 } from "./appel-centre15.ts";
import { atmpLie } from "./atmp-lie.ts";
import { autonomieProfessionnel } from "./autonomie-professionnel.ts";
import { avionBateauLigne } from "./avion-bateau-ligne.ts";
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
import { distancePlus50 } from "./distance-plus-50.ts";
import { distancePlus150 } from "./distance-plus-150.ts";
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
import { permission } from "./permission.ts";
import { permissionChargePatient } from "./permission-charge-patient.ts";
import { permissionMineurAdmissible } from "./permission-mineur-admissible.ts";
import { prefereTransportCommun } from "./prefere-transport-commun.ts";
import { prestationNonCouverteDeclaree } from "./prestation-non-couverte-declaree.ts";
import { preuvePrescripteurQualifiante } from "./preuve-prescripteur-qualifiante.ts";
import { preuvePrestationAbsente } from "./preuve-prestation-absente.ts";
import { regimeVerifie } from "./regime-verifie.ts";
import { serieQualifiante } from "./serie-qualifiante.ts";
import { situationSoinsQualifiante } from "./situation-soins-qualifiante.ts";
import { sourceOfficielleActive } from "./source-officielle-active.ts";
import { trajetEtranger } from "./trajet-etranger.ts";
import { transfertArticle80 } from "./transfert-article80.ts";
import { urgenceAttestee } from "./urgence-attestee.ts";
import { urgenceRepondue } from "./urgence-repondue.ts";

/** Les faits du modèle, chacun déclaré une fois. */
export const CATALOGUE_DES_FAITS = new FaitCatalogue<Faits>(FAITS, [
  p1Complete,
  p2Complete,
  sourceOfficielleActive,
  correspondanceUnivoque,
  conditionsSoinVerifiees,
  regimeVerifie,
  exclusionSoinProuvee,
  exclusionTransportProuvee,
  preuvePrescripteurQualifiante,
  preuvePrestationAbsente,
  prestationNonCouverteDeclaree,
  mineurSoinsProlongesAVerifier,
  centreReferenceDestination,
  autonomieProfessionnel,
  critereAllonge,
  critereBrancard,
  critereSurveillance,
  critereOxygene,
  critereAsepsie,
  critereFauteuil,
  critereTap,
  partageIncompatible,
  bariatrique,
  accompagnant,
  prefereTransportCommun,
  aldLiee,
  aldExonerante3Ou4,
  mineurSoinsProlongesReconnus,
  evenementSansSoin,
  motifCamsp,
  situationSoinsQualifiante,
  hospitalisation,
  trajetEtranger,
  atmpLie,
  motifSamsah,
  motifPension,
  htnmHorsMaternite,
  htnmSegmentVerifie,
  dapMaternite,
  convocation,
  transfertArticle80,
  centre15Interetablissements,
  appelCentre15,
  exceptionArticle80AdmissionSansSejour,
  exceptionArticle80AirMer,
  exceptionArticle80HadIntercurrent,
  exceptionArticle80Usld,
  exceptionArticle80Ehpad,
  exceptionArticle80Radiotherapie,
  exceptionArticle80DialyseDomicile,
  exceptionArticle80AdmissionHad,
  distancePlus50,
  distancePlus150,
  serieQualifiante,
  avionBateauLigne,
  urgenceAttestee,
  urgenceRepondue,
  permission,
  permissionChargePatient,
  permissionMineurAdmissible,
]);
