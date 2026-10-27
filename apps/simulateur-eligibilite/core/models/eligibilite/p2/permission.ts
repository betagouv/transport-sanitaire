// La permission : quand Q2.7, Q2.7.a et Q2.8 se posent, et les contrôles de
// dates de Q2.8 (D-107). Ses faits vivent sous `faits/`, et ce qu'en lisent
// plusieurs dans `Permission`.

import { given } from "../question.ts";

/** La durée maximale d'une permission, en heures. */
const DUREE_MAXIMALE_EN_HEURES = 48;
/** La première permission commence au 14e jour d'hospitalisation, ou après. */
const PREMIER_JOUR_AUTORISE = 14;

const tranche = given.question("Q2.7").answer();
const hospitalisation = given.question("Q2.8.1").answer().toDate();
const debut = given.question("Q2.8.2").answer().toDate();
const fin = given.question("Q2.8.3").answer().toDate();
const finDeLaPeriode = given.question("Q2.8.6").answer().toDate();

/**
 * Les options adultes de Q2.7 se proposent, sauf si Q1.3 dit un patient de
 * moins de 18 ans : un fait acquis retire les choix qu'il contredit.
 */
export const desAdultesAProposer = given
  .question("Q1.3")
  .answer()
  .checked("8_MINEUR_SOINS_CONTINUS")
  .not();

/** Q2.7 dit un adulte qui demande par écrit un transport exceptionnel. */
export const aLaChargeDuPatient = tranche.is("4_ADULTE_A_SA_CHARGE");

/** Q2.7 dit un patient de moins de 20 ans : Q2.8 se pose alors. */
export const unMineurDeVingtAns = tranche.isOneOf(
  "1_MOINS_DE_SEIZE_ANS",
  "2_SEIZE_A_DIX_NEUF_ANS",
);

/** Q2.8.5 dit plusieurs permissions, pour un patient de moins de 20 ans. */
export const plusieursPermissions = unMineurDeVingtAns.and(
  given.question("Q2.8.5").answer().is("1_OUI"),
);

/** La première permission commence avant le jour de l'hospitalisation. */
export const commenceAvantLHospitalisation = debut.isBefore(hospitalisation);

/**
 * Elle commence avant le 14e jour d'hospitalisation. Le jour de
 * l'hospitalisation est le jour 1 : le 14e jour, à minuit, est permis.
 */
export const commenceAvantLeQuatorziemeJour = debut.isBefore(
  hospitalisation.plusDays(PREMIER_JOUR_AUTORISE - 1),
);

/** Elle finit en même temps que son début, ou avant. */
export const neFinitPasApresSonDebut = fin.isAtOrBefore(debut);

/** Elle dure plus de 48 heures. 48 heures pile sont permises. */
export const depasseQuaranteHuitHeures = fin.isAfter(
  debut.plusHours(DUREE_MAXIMALE_EN_HEURES),
);

/**
 * La période des permissions finit un jour avant la fin de la première. Le
 * jour même est permis : la période se donne en jours, la permission en
 * heures.
 */
export const periodeFinitAvantLaPremiere = finDeLaPeriode.isBefore(
  fin.startOfDay(),
);
