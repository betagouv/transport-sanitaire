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
import { accompagnant } from "./accompagnant.fait.ts";
import { aldExonerante3Ou4 } from "./ald-exonerante-3-ou-4.fait.ts";
import { aldLiee } from "./ald-liee.fait.ts";
import { appelCentre15 } from "./appel-centre15.fait.ts";
import { atmpLie } from "./atmp-lie.fait.ts";
import { autonomieProfessionnel } from "./autonomie-professionnel.fait.ts";
import { avionBateauLigne } from "./avion-bateau-ligne.fait.ts";
import { bariatrique } from "./bariatrique.fait.ts";
import { centreReferenceDestination } from "./centre-reference-destination.fait.ts";
import { centre15Interetablissements } from "./centre15-interetablissements.fait.ts";
import { conditionsSoinVerifiees } from "./conditions-soin-verifiees.fait.ts";
import { convocation } from "./convocation.fait.ts";
import { correspondanceUnivoque } from "./correspondance-univoque.fait.ts";
import { critereAllonge } from "./critere-allonge.fait.ts";
import { critereAsepsie } from "./critere-asepsie.fait.ts";
import { critereBrancard } from "./critere-brancard.fait.ts";
import { critereFauteuil } from "./critere-fauteuil.fait.ts";
import { critereOxygene } from "./critere-oxygene.fait.ts";
import { critereSurveillance } from "./critere-surveillance.fait.ts";
import { critereTap } from "./critere-tap.fait.ts";
import { dapMaternite } from "./dap-maternite.fait.ts";
import { distancePlus50 } from "./distance-plus-50.fait.ts";
import { distancePlus150 } from "./distance-plus-150.fait.ts";
import { evenementSansSoin } from "./evenement-sans-soin.fait.ts";
import { exceptionArticle80AdmissionHad } from "./exception-article80-admission-had.fait.ts";
import { exceptionArticle80AdmissionSansSejour } from "./exception-article80-admission-sans-sejour.fait.ts";
import { exceptionArticle80AirMer } from "./exception-article80-air-mer.fait.ts";
import { exceptionArticle80DialyseDomicile } from "./exception-article80-dialyse-domicile.fait.ts";
import { exceptionArticle80Ehpad } from "./exception-article80-ehpad.fait.ts";
import { exceptionArticle80HadIntercurrent } from "./exception-article80-had-intercurrent.fait.ts";
import { exceptionArticle80Radiotherapie } from "./exception-article80-radiotherapie.fait.ts";
import { exceptionArticle80Usld } from "./exception-article80-usld.fait.ts";
import { exclusionSoinProuvee } from "./exclusion-soin-prouvee.fait.ts";
import { exclusionTransportProuvee } from "./exclusion-transport-prouvee.fait.ts";
import { finaliteSoinsLongueDistance } from "./finalite-soins-longue-distance.fait.ts";
import { hospitalisation } from "./hospitalisation.fait.ts";
import { htnmHorsMaternite } from "./htnm-hors-maternite.fait.ts";
import { htnmSegmentVerifie } from "./htnm-segment-verifie.fait.ts";
import { mineurSoinsProlongesAVerifier } from "./mineur-soins-prolonges-a-verifier.fait.ts";
import { mineurSoinsProlongesReconnus } from "./mineur-soins-prolonges-reconnus.fait.ts";
import { motifCamsp } from "./motif-camsp.fait.ts";
import { motifPension } from "./motif-pension.fait.ts";
import { motifSamsah } from "./motif-samsah.fait.ts";
import { FAITS, type Faits } from "./noms.ts";
import { p1Complete } from "./p1-complete.fait.ts";
import { p2Complete } from "./p2-complete.fait.ts";
import { partageIncompatible } from "./partage-incompatible.fait.ts";
import { permission } from "./permission.fait.ts";
import { permissionChargePatient } from "./permission-charge-patient.fait.ts";
import { permissionMineurAdmissible } from "./permission-mineur-admissible.fait.ts";
import { prefereTransportCommun } from "./prefere-transport-commun.fait.ts";
import { prestationNonCouverteDeclaree } from "./prestation-non-couverte-declaree.fait.ts";
import { preuvePrescripteurQualifiante } from "./preuve-prescripteur-qualifiante.fait.ts";
import { preuvePrestationAbsente } from "./preuve-prestation-absente.fait.ts";
import { regimeVerifie } from "./regime-verifie.fait.ts";
import { serieQualifiante } from "./serie-qualifiante.fait.ts";
import { situationSoinsQualifiante } from "./situation-soins-qualifiante.fait.ts";
import { sourceOfficielleActive } from "./source-officielle-active.fait.ts";
import { trajetEtranger } from "./trajet-etranger.fait.ts";
import { transfertArticle80 } from "./transfert-article80.fait.ts";
import { typeDialyseNonVerifiable } from "./type-dialyse-non-verifiable.fait.ts";
import { urgenceAttestee } from "./urgence-attestee.fait.ts";
import { urgenceRepondue } from "./urgence-repondue.fait.ts";

/** Les faits du modèle, chacun déclaré une fois. */
// Annoté : les questions lisent ce catalogue, et ses faits lisent leurs
// réponses. Inféré, son type tournerait en rond.
export const CATALOGUE_DES_FAITS: FaitCatalogue<Faits> = new FaitCatalogue(
  FAITS,
  [
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
    finaliteSoinsLongueDistance,
    serieQualifiante,
    avionBateauLigne,
    urgenceAttestee,
    urgenceRepondue,
    permission,
    permissionChargePatient,
    permissionMineurAdmissible,
    typeDialyseNonVerifiable,
  ],
);
