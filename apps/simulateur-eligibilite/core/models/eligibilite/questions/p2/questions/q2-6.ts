// Q2.6.a, le type du transfert, posée à part, puis Q2.6, les exceptions de
// l'article 80, sur la même page (D-106). Les exceptions attendent le type
// quand il se pose : leurs options en dépendent. Les faits de l'article 80
// vivent sous `faits/`.

import type { Condition } from "../../../../../socle/index.ts";
import { OPTIONS, type Questions } from "../../catalogue/catalogue.ts";
import { given, question } from "../../question.ts";
import {
  unSejourEnEtablissement,
  unSejourEnHad,
} from "../conditions/sejour.ts";

type Exception = Questions["Q2.6"][number];

const deplacement = given.question("Q2.5").answer();
const unTransfert = deplacement.is("1_TRANSFERT");
const unAutreDeplacement = deplacement.is("2_AUTRE_DEPLACEMENT");
const type = given.question("Q2.6.a").answer();

/** Q2.5 dit un transfert entre établissements : Q2.6.a se pose alors. */
const unTypeAPoser = unTransfert;

export const Q2_6_A = question
  .singleChoice("Q2.6.a", "Le transfert est-il définitif ou provisoire ?")
  .appliesWhen(unTypeAPoser);

/**
 * Q2.6 se pose dans le champ I de l'article 80 : un transfert, un autre
 * déplacement pendant un séjour en établissement, une admission en HAD que
 * Q2.1.g établit ou un séjour en HAD (TS1014-B01), sans Q2.5. Elle attend le
 * type du transfert quand il se pose.
 */
const desExceptionsAPoser = unTransfert
  .or(unAutreDeplacement.and(unSejourEnEtablissement))
  .or(given.question("Q2.1.g").answer().is("3_ADMISSION_HAD"))
  .or(unSejourEnHad)
  .and(unTypeAPoser.not().or(type.isPresent()));

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
    .question("Q2.3.2")
    .answer()
    .compute((ligne) => ligne.isNot(true)),
  "8_RADIOTHERAPIE": unTransfert
    .and(type.is("2_PROVISOIRE"))
    .or(unAutreDeplacement),
};

// Les exceptions de Q2.6, hors « Aucune », qui est exclusive.
const EXCEPTIONS = (Object.keys(OPTIONS["Q2.6"]) as Exception[]).filter(
  (exception) => exception !== "11_AUCUNE",
);

// Chaque exception ne se propose que si le transfert l'admet.
export const Q2_6 = EXCEPTIONS.reduce((declaree, exception) => {
  const aProposer = EXCEPTIONS_A_PROPOSER[exception];
  return aProposer
    ? declaree.option(exception, (option) => option.offeredWhen(aProposer))
    : declaree;
}, question
  .multipleChoice(
    "Q2.6",
    "Quelle situation précise et quelles exceptions s’appliquent à ce déplacement ?",
  )
  .appliesWhen(desExceptionsAPoser)
  .exclusive("11_AUCUNE"));
