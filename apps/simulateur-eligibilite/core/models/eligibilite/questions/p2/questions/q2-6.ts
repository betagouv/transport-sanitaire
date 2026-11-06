// Q2.6.a, le type du transfert, posée à part, puis Q2.6, les exceptions de
// l'article 80, sur la même page (D-106). Les exceptions attendent le type
// quand il se pose : leurs options en dépendent. Les faits de l'article 80
// vivent sous `faits/`.

import type { AnswerOf, Condition } from "../../../../../socle/index.ts";
import { Q1_3 } from "../../p1/questions/q1-3.ts";
import { given, question } from "../../question.ts";
import {
  LIEUX_INCOMPATIBLES,
  unConflitDeLieuxApparu,
} from "../conditions/conflit-de-lieux.ts";
import {
  unSejourEnEtablissement,
  unSejourEnHad,
} from "../conditions/sejour.ts";
import { Q2_1_G } from "./q2-1.ts";
import { Q2_2_1 } from "./q2-2-1.ts";
import { Q2_2_1_A } from "./q2-2-1-a.ts";
import { Q2_2_1_CADRE } from "./q2-2-1-cadre.ts";
import { Q2_3_2 } from "./q2-3-2.ts";
import { Q2_5 } from "./q2-5.ts";

const deplacement = given.question(Q2_5).answer();
const unTransfert = deplacement.is("1_TRANSFERT");
const unAutreDeplacement = deplacement.is("2_AUTRE_DEPLACEMENT");

/** Q2.5 dit un transfert entre établissements : Q2.6.a se pose alors. */
const unTypeAPoser = unTransfert;

export const Q2_6_A = question
  .singleChoice("Q2.6.a", "Le transfert est-il définitif ou provisoire ?")
  // Le type du transfert : l'option 1 du catalogue de Q2.6, posée à part
  // (D-106).
  .options({
    "1_DEFINITIF": "Définitif (au moins 48 heures).",
    "2_PROVISOIRE":
      "Provisoire (moins de 48 heures avec retour dans l’établissement d’origine).",
  })
  .appliesWhen(unTypeAPoser);

const type = given.question(Q2_6_A).answer();

/**
 * Q2.6 se pose dans le champ I de l'article 80 : un transfert, un autre
 * déplacement pendant un séjour en établissement, une admission en HAD que
 * Q2.1.g établit ou un séjour en HAD (TS1014-B01), sans Q2.5. Elle attend le
 * type du transfert quand il se pose.
 */
const desExceptionsAPoser = unTransfert
  .or(unAutreDeplacement.and(unSejourEnEtablissement))
  .or(given.question(Q2_1_G).answer().is("3_ADMISSION_HAD"))
  .or(unSejourEnHad)
  .and(unTypeAPoser.not().or(type.isPresent()));

// Q2.6 et ses options, avant les conditions de ses options.
const exceptions = question
  .multipleChoice(
    "Q2.6",
    "Quelle situation précise et quelles exceptions s’appliquent à ce déplacement ?",
  )
  // Les options gardent leur numéro du catalogue, où le type est l'option 1.
  // L'option 4 est la nôtre (D-106).
  .options({
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
  })
  .appliesWhen(desExceptionsAPoser)
  .exclusive("11_AUCUNE");

type Exception = AnswerOf<typeof exceptions>[number];

/**
 * Quand une exception se propose. Pour une admission ou un séjour en HAD, sans
 * Q2.5, les options 2, 3 et 8 ne se proposent pas. Les autres se proposent
 * toujours.
 */
const EXCEPTIONS_A_PROPOSER: Partial<Record<Exception, Condition>> = {
  "2_ADMISSION_SANS_SEJOUR": unTransfert
    .and(type.is("1_DEFINITIF"))
    .and(unSejourEnEtablissement.not()),
  "3_CENTRE_QUINZE": unTransfert,
  "4_AIR_MER": given
    .question(Q2_3_2)
    .answer()
    .compute((ligne) => ligne.isNot(true)),
  "8_RADIOTHERAPIE": unTransfert
    .and(type.is("2_PROVISOIRE"))
    .or(unAutreDeplacement),
};

// Une admission en HAD ou une radiothérapie fixe un lieu : un autre lieu déjà
// dit la contredit.
const unConflitDeLieux = unConflitDeLieuxApparu("contexte", {
  soins: Q1_3,
  sousType: Q2_1_G,
  situations: Q2_2_1,
  sejour: Q2_2_1_CADRE,
  enPermission: Q2_2_1_A,
  transfert: Q2_5,
  contexte: exceptions,
});

// Chaque exception de la table ne se propose que si sa condition tient. Les
// autres se proposent toujours.
export const Q2_6 = (
  Object.entries(EXCEPTIONS_A_PROPOSER) as [Exception, Condition][]
)
  .reduce(
    (declaree, [exception, aProposer]) =>
      declaree.option(exception, (option) => option.offeredWhen(aProposer)),
    exceptions,
  )
  .inconsistentWhen(unConflitDeLieux, LIEUX_INCOMPATIBLES);
