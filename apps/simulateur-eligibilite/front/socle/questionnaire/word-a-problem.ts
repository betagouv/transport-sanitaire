// Ce que l'écran écrit d'une saisie fautive : un message par nature de
// problème. Le moteur de questionnaire (`core/`) dit ce qu'il constate ; les
// phrases de l'éditeur lui viennent toutes faites.

import type {
  Answer,
  AnswerProblem,
  AskedQuestion,
  Unanswered,
} from "../../../core/socle/questionnaire-engine";

/** Ce qui ne va pas dans une saisie, un message par ligne sous le champ. */
export function errorsOf(
  question: AskedQuestion,
  answer: Answer | Unanswered,
): readonly string[] {
  return question.problemsWith(answer).map(messageOf);
}

/** Le message d'un problème de saisie. */
export function messageOf(problem: AnswerProblem): string {
  switch (problem.kind) {
    case "missing":
      return "Cette réponse est attendue.";
    case "nothing checked":
      return "Cochez au moins une réponse.";
    case "not a number":
      return "Indiquez un nombre.";
    case "not an integer":
      return "Indiquez un nombre entier, sans décimale.";
    case "number below":
      return `Indiquez un nombre d’au moins ${problem.min}.`;
    case "number above":
      return `Indiquez un nombre d’au plus ${problem.max}.`;
    case "date before":
      return `Indiquez une date à partir du ${displayedDate(problem.min)}.`;
    case "date after":
      return `Indiquez une date au plus tard le ${displayedDate(problem.max)}.`;
    case "invalid postal code":
      return "Indiquez un code postal de 5 chiffres.";
    case "stated":
      return problem.text;
  }
}

// ---- implémentation ----

// « 2026-10-12T08:30 » se lit « 12/10/2026 à 08:30 ».
function displayedDate(iso: string): string {
  const [date = "", time] = iso.split("T");
  const [year, month, day] = date.split("-");
  const displayed = `${day}/${month}/${year}`;
  return time ? `${displayed} à ${time.slice(0, 5)}` : displayed;
}
