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
import { FAITS_DE_LA_BRANCHE } from "../p2/branche.ts";
import { FAITS_DES_CONTEXTES } from "../p2/contextes.ts";
import { FAITS_DE_LA_CONVOCATION } from "../p2/convocation.ts";
import { FAITS_DE_LA_PERMISSION } from "../p2/permission.ts";
import { FAITS_DE_LA_PRESTATION } from "../p2/prestation.ts";
import { FAITS_DU_TRAJET } from "../p2/trajet.ts";
import { FAITS_DU_TRANSFERT } from "../p2/transfert.ts";
import { accompagnant } from "./accompagnant.ts";
import { aldExonerante3Ou4 } from "./ald-exonerante-3-ou-4.ts";
import { aldLiee } from "./ald-liee.ts";
import { autonomieProfessionnel } from "./autonomie-professionnel.ts";
import { bariatrique } from "./bariatrique.ts";
import { centreReferenceDestination } from "./centre-reference-destination.ts";
import { conditionsSoinVerifiees } from "./conditions-soin-verifiees.ts";
import { correspondanceUnivoque } from "./correspondance-univoque.ts";
import { critereAllonge } from "./critere-allonge.ts";
import { critereAsepsie } from "./critere-asepsie.ts";
import { critereBrancard } from "./critere-brancard.ts";
import { critereFauteuil } from "./critere-fauteuil.ts";
import { critereOxygene } from "./critere-oxygene.ts";
import { critereSurveillance } from "./critere-surveillance.ts";
import { critereTap } from "./critere-tap.ts";
import { exclusionSoinProuvee } from "./exclusion-soin-prouvee.ts";
import { exclusionTransportProuvee } from "./exclusion-transport-prouvee.ts";
import { mineurSoinsProlongesAVerifier } from "./mineur-soins-prolonges-a-verifier.ts";
import { mineurSoinsProlongesReconnus } from "./mineur-soins-prolonges-reconnus.ts";
import { p1Complete } from "./p1-complete.ts";
import { p2Complete } from "./p2-complete.ts";
import { partageIncompatible } from "./partage-incompatible.ts";
import { prefereTransportCommun } from "./prefere-transport-commun.ts";
import { prestationNonCouverteDeclaree } from "./prestation-non-couverte-declaree.ts";
import { preuvePrescripteurQualifiante } from "./preuve-prescripteur-qualifiante.ts";
import { preuvePrestationAbsente } from "./preuve-prestation-absente.ts";
import { regimeVerifie } from "./regime-verifie.ts";
import { sourceOfficielleActive } from "./source-officielle-active.ts";

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
  },
  FAITS_DU_TRAJET,
  FAITS_DE_LA_PRESTATION,
  FAITS_DES_CONTEXTES,
  FAITS_DU_TRANSFERT,
  FAITS_DE_LA_PERMISSION,
  FAITS_DE_LA_CONVOCATION,
  FAITS_DE_LA_BRANCHE,
);
