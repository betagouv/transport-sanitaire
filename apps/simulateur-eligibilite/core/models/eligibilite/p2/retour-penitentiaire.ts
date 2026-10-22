// Le retour vers un établissement pénitentiaire (option 10 de Q2.2.1.b) : ce
// qui qualifie son circuit avant R2 (points 33 et 34 de la v10.1.3,
// `CONTRAT_CONTEXTES_V1012.json` et `CONTRAT_ORIENTATION_ADMINISTRATIVE.json`).
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

import {
  Fait,
  type GivenAnswers,
  type QuestionnairePart,
  type ValidatedAnswers,
} from "../../../socle/index.ts";
import type { Faits } from "../declarations/faits.ts";
import type { Questions } from "../declarations/questions.ts";

type Valides = ValidatedAnswers<Questions>;
type Page = QuestionnairePart<Questions, undefined>["pages"][number];

/** Le message qui refuse un transfert entre établissements vers la prison. */
export const TRANSFERT_VERS_LA_PRISON =
  "Un transfert entre établissements de santé ne mène pas à un établissement pénitentiaire. Corrigez cette réponse, ou retirez le retour pénitentiaire des situations particulières.";

/**
 * Q2.2.1.indication se pose-t-elle ? Le retour est coché sur sa page, et P1,
 * validée avant elle, n'établit aucune indication médicale.
 */
export function indicationAPoser(
  answers: GivenAnswers<Questions>,
  validated: Valides,
): boolean {
  return retourCoche(answers) && !indicationEtablie(validated);
}

/** Le retour relève-t-il de la seule organisation pénitentiaire ? */
export function horsCircuit(validated: Valides): boolean {
  return validated.question("Q2.2.1.indication").is("2_NON");
}

/** La page, dont rien ne se pose plus hors du circuit de prescription. */
export function dansLeCircuit(page: Page): Page {
  return {
    ...page,
    questions: page.questions.map((question) => ({
      ...question,
      askedIf: (context) =>
        !horsCircuit(context.validated) &&
        (question.askedIf?.(context) ?? true),
    })),
  };
}

/** Le retour pénitentiaire est-il une sortie définitive d'hospitalisation ? */
export function sortieVersLaPrison(validated: Valides): boolean {
  return (
    retourCoche(validated) &&
    validated.question("Q2.1.g").is("2_SORTIE") &&
    validated.question("Q2.2.1.a").isNot("1_OUI")
  );
}

/** Le retour pénitentiaire est-il coché, une fois sa page validée ? */
export function retourPenitentiaireValide(validated: Valides): boolean {
  return retourCoche(validated);
}

/** Le retour pénitentiaire est-il coché, dans les réponses acquises au verrou ? */
export function retourPenitentiaireCoche(
  answers: GivenAnswers<Questions>,
): boolean {
  return retourCoche(answers);
}

/** Les faits qu'une sortie définitive vers la prison établit. */
export function faitsDuRetourPenitentiaire(validated: Valides): Partial<Faits> {
  if (!sortieVersLaPrison(validated)) return {};
  const source =
    "Q2.1.g : « 2_SORTIE », Q2.2.1.b : « 10_RETOUR_PENITENTIAIRE » ; sortie définitive vers la prison.";
  const deduit = Fait.non("fait_permission vaut « non » : aucune permission.");
  return {
    fait_transfert_article80: Fait.non(source),
    fait_centre15_interetablissements: Fait.non(source),
    fait_permission: Fait.non(source),
    fait_permission_charge_patient: deduit,
    fait_permission_mineur_admissible: deduit,
  };
}

// ---- implémentation ----

// Un critère de Q1.2, une ALD, une séance ou un autre cas de Q1.3.
function indicationEtablie(validated: Valides): boolean {
  return (
    validated.question("Q1.2").hasAnyChecked() ||
    validated
      .question("Q1.3")
      .checkedBoxes()
      .some((cas) => cas !== "7_AUCUNE")
  );
}

// Sur la page en cours (les réponses données) comme une fois validée.
function retourCoche(reponses: GivenAnswers<Questions> | Valides): boolean {
  return (
    reponses.question("Q2.2.1").checked("3_AUTRE_CADRE") &&
    reponses.question("Q2.2.1.b").checked("10_RETOUR_PENITENTIAIRE")
  );
}
