// Les questions du modèle, sous l'identifiant que l'éditeur leur donne, et le
// type de la réponse de chacune.
//
// Une option se répond par un slug : son numéro dans le catalogue de l'éditeur,
// puis ce qu'elle veut dire. Le libellé est celui du catalogue, mot pour mot.
// Les options se déclarent dans l'ordre du catalogue : c'est l'ordre de l'écran,
// sauf quand le catalogue en donne un autre (Q1.3).

import { OPTIONS_DE_LA_BRANCHE } from "./options-de-la-branche.ts";
import { OPTIONS_DE_LA_CONVOCATION } from "./options-de-la-convocation.ts";
import { OPTIONS_DE_LA_PERMISSION } from "./options-de-la-permission.ts";
import { OPTIONS_DU_COMPLEMENT } from "./options-du-complement.ts";
import { OPTIONS_DU_PATIENT } from "./options-du-patient.ts";
import type { QuestionsDuComplement } from "./questions-du-complement.ts";

/** Les options de chaque question à choix : leur slug, et leur libellé. */
export const OPTIONS = {
  /** Quel est votre besoin ? */
  "Q0.1": {
    "1_VERIFIER": "Vérifier une éligibilité",
    "2_VERIFIER_ET_PRESCRIRE":
      "Vérifier et prescrire si la situation le permet",
  },
  ...OPTIONS_DU_PATIENT,
  /** Quelle situation médicale ou quel événement motive ce déplacement ? */
  "Q2.1": {
    "1_CONSULTATION":
      "Consultation médicale de diagnostic, de traitement ou de suivi, dont suivi de l’Affection Longue Durée (ALD).",
    "2_DENTISTE_OU_SAGE_FEMME":
      "Consultation ou soin réalisé par un chirurgien-dentiste ou une sage-femme.",
    "3_IMAGERIE": "Examen d’imagerie ou autre acte médical technique.",
    "4_BIOLOGIE": "Analyse ou examen de biologie médicale.",
    "5_PARAMEDICAL":
      "Rééducation, orthophonie, soins infirmiers ou autre soin paramédical.",
    "6_SEANCE": "Chimiothérapie, radiothérapie ou dialyse.",
    "7_PSYCHOLOGUE": "Séance de psychologue ou dispositif particulier.",
    "8_HOSPITALISATION":
      "Entrée ou sortie d’hospitalisation, ou admission en Hospitalisation à Domicile (HAD).",
    "9_TRANSFERT":
      "Transfert entre établissements, ou déplacement pour soin pendant l’hospitalisation.",
    "10_CAMSP":
      "Soin Centre d’Action Médico-Sociale Précoce (CAMSP)/Centre Médico-Psycho-Pédagogique (CMPP), y compris séance en ville organisée dans le parcours de l’enfant.",
    "11_PERMISSION": "Permission temporaire pendant l’hospitalisation.",
    "12_CONVOCATION":
      "Convocation, expertise, audience ou déplacement chez un fournisseur d’appareillage.",
    "13_MATERNITE":
      "À un examen obligatoire du 8ᵉ ou du 9ᵉ mois de grossesse en maternité, ou à un hébergement temporaire prévu en raison de l’éloignement de la maternité.",
    "14_AUTRE": "Autre soin, examen ou séjour.",
    "15_AUCUN": "Aucun de ces soins ou événements.",
  },
  /** Les séances sélectionnées motivent-elles le même déplacement ? */
  "Q2.1.f": {
    "1_OUI": "Oui, il s’agit du même déplacement et du même lieu",
    "2_NON": "Non, il s’agit de déplacements ou de lieux différents",
  },
  /** Entrée, sortie ou admission en HAD ? */
  "Q2.1.g": {
    "1_ENTREE": "Une entrée dans un établissement de santé",
    "2_SORTIE": "Une sortie de cet établissement",
    "3_ADMISSION_HAD":
      "Une admission en Hospitalisation à Domicile (HAD) à domicile",
  },
  /** Cette séance en ville est-elle organisée dans le cadre du parcours de soins de l’enfant ? */
  "Q2.1.h": {
    "1_OUI": "Oui.",
    "2_NON": "Non.",
  },
  /** L’une de ces situations correspond-elle aussi au trajet à réaliser ? */
  "Q2.2.1": {
    "1_HOSPITALISATION":
      "Le patient est déjà hospitalisé pendant ce trajet, y compris en Hospitalisation à Domicile (HAD).",
    "2_ETRANGER":
      "Le départ, l’arrivée ou le lieu de soins concerné se trouve à l’étranger.",
    "3_AUTRE_CADRE": "Une autre situation particulière concerne ce trajet.",
    // Le libellé de `CONTRAT_Q221_PROGRESSIF.json` en v10.1.2, toujours, et
    // non celui du catalogue quand aucun contexte n'est acquis.
    "4_AUCUNE": "Aucune autre situation parmi celles proposées.",
  },
  /**
   * Dans quel cadre le patient est-il actuellement hospitalisé ? Le
   * `hospitalStayQuestion` de l'éditeur (TS1014-B01).
   */
  "Q2.2.1.cadre": {
    "1_ETABLISSEMENT": "En séjour dans un établissement de santé.",
    "2_HAD": "En Hospitalisation à Domicile (HAD).",
  },
  /** Ce trajet correspond-il à une permission temporaire de sortie de l’hôpital ? */
  "Q2.2.1.a": {
    "1_OUI": "Oui.",
    "2_NON": "Non.",
  },
  /**
   * Laquelle ou lesquelles de ces situations concernent aussi ce trajet ? Les
   * options gardent leur numéro parmi les treize du catalogue (S1). Le centre
   * de référence (8) n'en est plus depuis la v10.1.2 : il se recueille en P3.
   */
  "Q2.2.1.b": {
    "1_ATMP": "À un accident du travail ou à une maladie professionnelle.",
    "4_MATERNITE_ELOIGNEE":
      "À un examen obligatoire du 8ᵉ ou du 9ᵉ mois de grossesse en maternité, ou à un hébergement temporaire prévu en raison de l’éloignement de la maternité.",
    "5_HTNM":
      "À un hébergement temporaire non médicalisé en lien avec les soins, pour un autre motif que l’éloignement d’une maternité.",
    "6_CAMSP":
      "À des soins dans le cadre d’un Centre d’Action Médico-Sociale Précoce (CAMSP) ou d’un Centre Médico-Psycho-Pédagogique (CMPP), y compris une séance en ville organisée dans le parcours de l’enfant.",
    "7_SAMSAH":
      "À des soins dans un Service d’Accompagnement Médico-Social pour Adultes Handicapés (SAMSAH).",
    "9_PENSION_MILITAIRE":
      "À des soins en rapport avec une pension militaire d’invalidité.",
    "10_RETOUR_PENITENTIAIRE":
      "À un retour vers un établissement pénitentiaire.",
    "13_CONVOCATION":
      "À une convocation de contrôle, une expertise ou un rendez-vous chez un fournisseur d’appareillage.",
  },
  /**
   * Ce retour nécessite-t-il un transport pour raison médicale ? Le
   * `Q2.2.1.prison-medical` de l'éditeur (point 33, v10.1.3).
   */
  "Q2.2.1.indication": {
    "1_OUI": "Oui.",
    "2_NON": "Non.",
  },
  /** Sélectionnez la ou les adresses situées à l’étranger */
  "Q2.2.5": {
    "1_DEPART": "Adresse de départ située à l’étranger.",
    "2_ARRIVEE": "Adresse d’arrivée située à l’étranger.",
    "3_LIEU_DES_SOINS":
      "Adresse du lieu de soins située à l’étranger (à ne sélectionner que si elle est différente des adresses de départ et d’arrivée).",
  },
  /** Quelle distance sépare les lieux de départ et d’arrivée ? */
  "Q2.3.1": {
    "1_CINQUANTE_KM_OU_MOINS": "50 km ou moins.",
    "2_PLUS_DE_CINQUANTE_KM": "Plus de 50 km, jusqu’à 150 km inclus.",
    "3_PLUS_DE_CENT_CINQUANTE_KM": "Plus de 150 km.",
  },
  /** Au moins 4 transports de plus de 50 km, sur 2 mois, pour le même traitement ? */
  "Q2.3.3": {
    "1_OUI": "Oui.",
    "2_NON": "Non.",
  },
  /** Attestez-vous que ce transport est urgent ? */
  "Q2.3.4": {
    "1_OUI": "Oui.",
    "2_NON": "Non.",
  },
  /** Quel type de déplacement le patient doit-il effectuer ? */
  "Q2.5": {
    "1_TRANSFERT": "Un transfert entre établissements.",
    "2_AUTRE_DEPLACEMENT": "Autre déplacement",
  },
  /** Le type du transfert : l'option 1 du catalogue, posée à part (D-106). */
  "Q2.6.a": {
    "1_DEFINITIF": "Définitif (au moins 48 heures).",
    "2_PROVISOIRE":
      "Provisoire (moins de 48 heures avec retour dans l’établissement d’origine).",
  },
  /**
   * Quelle situation précise et quelles exceptions s’appliquent à ce
   * déplacement ? Les options gardent leur numéro du catalogue, où le type est
   * l'option 1. L'option 4 est la nôtre (D-106).
   */
  "Q2.6": {
    "2_ADMISSION_SANS_SEJOUR":
      "Admission dans un nouvel établissement, sans hospitalisation dans l’établissement de départ.",
    "3_CENTRE_QUINZE":
      "Transport sanitaire demandé par le Centre 15, hors Structure Mobile d’Urgence et de Réanimation (SMUR), dans le cadre de l’aide médicale urgente.",
    "4_AIR_MER": "Trajet aérien ou maritime autre qu’en ligne régulière.",
    "5_HAD":
      "Transport prescrit par une Hospitalisation à Domicile (HAD) hors soins liés à la Hospitalisation à Domicile (HAD).",
    "6_USLD":
      "Transport depuis/vers Unité de Soins de Longue Durée (USLD) hors même implantation géographique.",
    "7_EHPAD":
      "Transport depuis/vers Établissement d'Hébergement pour Personnes Âgées Dépendantes (EHPAD) hors même implantation géographique.",
    "8_RADIOTHERAPIE":
      "Transfert <48 heures pour radiothérapie en exercice libéral ou centre de santé.",
    "9_DIALYSE_A_DOMICILE": "Patient pratiquant la dialyse à domicile.",
    "10_ADMISSION_HAD":
      "Patient hospitalisé rentrant à domicile pour une admission en Hospitalisation à Domicile (HAD).",
    "11_AUCUNE": "Aucune de ces exceptions.",
  },
  ...OPTIONS_DE_LA_PERMISSION,
  ...OPTIONS_DE_LA_CONVOCATION,
  ...OPTIONS_DE_LA_BRANCHE,
  ...OPTIONS_DU_COMPLEMENT,
} as const;

type Option<Id extends keyof typeof OPTIONS> = keyof (typeof OPTIONS)[Id];

export type Questions = QuestionsDuComplement & {
  "Q0.1": Option<"Q0.1">;
  "Q1.1": Option<"Q1.1">;
  "Q1.2": readonly Option<"Q1.2">[];
  "Q1.3": readonly Option<"Q1.3">[];
  "Q1.3.a": Option<"Q1.3.a">;
  "Q1.3.b": Option<"Q1.3.b">;
  "Q1.4": Option<"Q1.4">;
  "Q2.1": Option<"Q2.1">;
  "Q2.1.f": Option<"Q2.1.f">;
  "Q2.1.g": Option<"Q2.1.g">;
  "Q2.1.h": Option<"Q2.1.h">;
  "Q2.2.1": readonly Option<"Q2.2.1">[];
  "Q2.2.1.cadre": Option<"Q2.2.1.cadre">;
  "Q2.2.1.a": Option<"Q2.2.1.a">;
  "Q2.2.1.b": readonly Option<"Q2.2.1.b">[];
  "Q2.2.1.indication": Option<"Q2.2.1.indication">;
  "Q2.2.5": readonly Option<"Q2.2.5">[];
  "Q2.3.1": Option<"Q2.3.1">;
  "Q2.3.2": boolean;
  "Q2.3.3": Option<"Q2.3.3">;
  "Q2.3.4": Option<"Q2.3.4">;
  "Q2.5": Option<"Q2.5">;
  "Q2.6.a": Option<"Q2.6.a">;
  "Q2.6": readonly Option<"Q2.6">[];
  "Q2.7": Option<"Q2.7">;
  "Q2.7.a": Option<"Q2.7.a">;
  // Les dates s'écrivent `AAAA-MM-JJ`, avec l'heure `AAAA-MM-JJTHH:mm`.
  "Q2.8.1": string;
  "Q2.8.2": string;
  "Q2.8.3": string;
  "Q2.8.4": Option<"Q2.8.4">;
  "Q2.8.4.a": Option<"Q2.8.4.a">;
  "Q2.8.5": Option<"Q2.8.5">;
  "Q2.8.6": string;
  /** Une permission aller-retour toutes les N semaines. */
  "Q2.8.6.a": number;
  "Q2.8.6.b": Option<"Q2.8.6.b">;
  "Q2.10": Option<"Q2.10">;
  "Q2.10.a": Option<"Q2.10.a">;
  "Q2.10.b": Option<"Q2.10.b">;
  "Q2.13.depart": Option<"Q2.13.depart">;
  "Q2.14.eloignement": readonly Option<"Q2.14.eloignement">[];
  "Q2.14.motif": readonly Option<"Q2.14.motif">[];
  "Q2.12": Option<"Q2.12">;
};

/**
 * Les motifs de Q2.1 qui retirent une situation de Q2.2.1.b : Q2.1 l'indique
 * déjà (D-98, TS1012-01). Les autres situations se proposent toujours. La page
 * des contextes et les faits de l'autre cadre écrivent chacun leur condition
 * sur cette table (D-208).
 */
export const RETIREE_SI_Q21: Partial<
  Record<Questions["Q2.2.1.b"][number], readonly Questions["Q2.1"][]>
> = {
  "4_MATERNITE_ELOIGNEE": ["13_MATERNITE"],
  "5_HTNM": ["13_MATERNITE"],
  "6_CAMSP": ["10_CAMSP"],
  "13_CONVOCATION": ["12_CONVOCATION"],
};
