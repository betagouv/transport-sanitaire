// Le retour vers un établissement pénitentiaire (option 10 de Q2.2.1.b) : ce
// qui qualifie son circuit avant R2 (points 33 et 34 de la v10.1.3,
// `CONTRAT_CONTEXTES_V1012.json` et `CONTRAT_ORIENTATION_ADMINISTRATIVE.json`).
// La sortie définitive vers la prison est une règle des faits
// (`faits/communs.ts`).
//
// Cocher l'option ne donne aucun fait, ni aucun financeur.
//
// - Un critère de Q1.2 ou un cas de Q1.3 établit déjà l'indication médicale du
//   transport. Sinon, Q2.2.1.indication la demande : voyager seul ou avec un
//   proche ne dit ni qu'elle existe, ni qu'elle manque (D-130).
// - « Non » sort le trajet du circuit de prescription : plus rien ne se pose,
//   les règles ne concluent pas, et R2 oriente vers l'administration
//   pénitentiaire, sans issue ni document.
// - Une sortie d'hospitalisation (Q2.1.g = 2), hors permission, est une sortie
//   définitive vers la prison : ni transfert de l'article 80, ni permission, ni
//   Centre 15 entre établissements. Q2.5 ne se pose pas.
// - Une permission suit sa branche (Q2.7, Q2.8), un transfert Q2.5 et Q2.6. Un
//   transfert entre établissements ne mène pas à une prison : il se refuse.
// - Pour tout autre soin, la prison n'est que l'adresse d'arrivée, en P3.

import type { ValidatedAnswers } from "../../../socle/index.ts";
import type { Questions } from "../declarations/questions.ts";
import { given } from "../question.ts";

type Valides = ValidatedAnswers<Questions>;

/** Le message qui refuse un transfert entre établissements vers la prison. */
export const TRANSFERT_VERS_LA_PRISON =
  "Un transfert entre établissements de santé ne mène pas à un établissement pénitentiaire. Corrigez cette réponse, ou retirez le retour pénitentiaire des situations particulières.";

/** Le retour pénitentiaire est coché dans l'autre cadre. */
export const unRetourPenitentiaire = given
  .question("Q2.2.1")
  .answer()
  .checked("3_AUTRE_CADRE")
  .and(given.question("Q2.2.1.b").answer().checked("10_RETOUR_PENITENTIAIRE"));

// Un critère de Q1.2, une ALD, une séance ou un autre cas de Q1.3 établit
// l'indication médicale.
const uneIndicationEtablie = given
  .question("Q1.2")
  .answer()
  .compute((criteres) => criteres.hasAnyChecked())
  .or(
    given
      .question("Q1.3")
      .answer()
      .compute((cas) => cas.checkedBoxes().some((un) => un !== "7_AUCUNE")),
  );

/**
 * Q2.2.1.indication se pose : le retour est coché, et P1 n'établit aucune
 * indication médicale.
 */
export const uneIndicationAPoser = unRetourPenitentiaire.and(
  uneIndicationEtablie.not(),
);

/** Le retour relève-t-il de la seule organisation pénitentiaire ? */
export function horsCircuit(validated: Valides): boolean {
  return validated.question("Q2.2.1.indication").is("2_NON");
}

/**
 * Le trajet reste dans le circuit de prescription. Hors du circuit, plus rien
 * ne se pose : c'est la condition des pages qui suivent les contextes.
 */
export const dansLeCircuit = given
  .question("Q2.2.1.indication")
  .answer()
  .is("2_NON")
  .not();
