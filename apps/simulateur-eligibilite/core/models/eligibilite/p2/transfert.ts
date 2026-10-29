// Le transfert et l'article 80 : quand Q2.5, Q2.6.a et Q2.6 se posent, et les
// exceptions qui se proposent (D-106). Les faits du transfert vivent sous
// `faits/`.

import type { Condition } from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";
import { given } from "../question.ts";
import { unRetourPenitentiaire } from "./retour-penitentiaire.ts";
import { unSejourEnEtablissement, unSejourEnHad } from "./sejour.ts";

type Exception = Questions["Q2.6"][number];

const deplacement = given.question("Q2.5").answer();
const unTransfert = deplacement.is("1_TRANSFERT");
const unAutreDeplacement = deplacement.is("2_AUTRE_DEPLACEMENT");
const type = given.question("Q2.6.a").answer();

// Une sortie d'hospitalisation vers la prison, hors permission, est définitive
// (TS1012-04).
const uneSortieVersLaPrison = unRetourPenitentiaire
  .and(given.question("Q2.1.g").answer().is("2_SORTIE"))
  .and(given.question("Q2.2.1.a").answer().is("1_OUI").not());

/**
 * Q2.5 se pose : Q2.1 dit un transfert, ou Q2.2.1.a écarte la permission, un
 * déplacement pendant l'hospitalisation au type à préciser. Une sortie
 * définitive vers la prison n'en est pas un.
 */
export const unTransfertAPoser = given
  .question("Q2.1")
  .answer()
  .is("9_TRANSFERT")
  .or(given.question("Q2.2.1.a").answer().is("2_NON"))
  .and(uneSortieVersLaPrison.not());

/** Un transfert entre établissements ne mène pas à une prison. */
export const unTransfertVersLaPrison = unTransfert.and(unRetourPenitentiaire);

/** Q2.5 dit un transfert entre établissements : Q2.6.a se pose alors. */
export const unTypeAPoser = unTransfert;

/**
 * Q2.6 se pose dans le champ I de l'article 80 : un transfert, un autre
 * déplacement pendant un séjour en établissement, une admission en HAD que
 * Q2.1.g établit ou un séjour en HAD (TS1014-B01), sans Q2.5. Elle attend le type du transfert quand il se pose.
 */
export const desExceptionsAPoser = unTransfert
  .or(unAutreDeplacement.and(unSejourEnEtablissement))
  .or(given.question("Q2.1.g").answer().is("3_ADMISSION_HAD"))
  .or(unSejourEnHad)
  .and(unTypeAPoser.not().or(type.isPresent()));

/**
 * Quand une exception se propose. Pour une admission ou un séjour en HAD, sans Q2.5, les
 * options 2, 3 et 8 ne se proposent pas. Les autres se proposent toujours.
 */
export const EXCEPTIONS_A_PROPOSER: Partial<Record<Exception, Condition>> = {
  "2_ADMISSION_SANS_SEJOUR": unTransfert
    .and(type.is("1_DEFINITIF"))
    .and(unSejourEnEtablissement.not()),
  "3_CENTRE_QUINZE": unTransfert,
  "4_AIR_MER": given
    .question("Q2.3.2")
    .answer()
    .compute((ligne) => ligne.isNot(true)),
  "8_RADIOTHERAPIE": unTransfert
    .and(type.is("2_PROVISOIRE"))
    .or(unAutreDeplacement),
};
