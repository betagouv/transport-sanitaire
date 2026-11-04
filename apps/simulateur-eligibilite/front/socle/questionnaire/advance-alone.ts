// L'avancement automatique du questionnaire.
//
// Une page autonome, un seul choix unique affiché seul, avance d'elle-même
// 200 ms après la réponse. Le bouton « Suivant » n'est alors pas affiché.
//
// Au retour sur une page déjà répondue, le bouton revient. Sinon « Précédent »
// renverrait aussitôt d'où l'on vient. Changer la réponse relance l'avancement.

import { useEffect, useRef, useState } from "react";
import type {
  Answer,
  AskedQuestion,
  Unanswered,
} from "../../../core/socle/questionnaire-engine";

import type { Actions } from "./questionnaire";

export type AutoAdvance = {
  /** La page avancera d'elle-même : le bouton « Suivant » n'a pas à s'afficher. */
  autoAdvances: boolean;
  /** À appeler sur toute saisie : elle relance l'avancement automatique. */
  onInput: () => void;
};

export function useAutoAdvance(
  page: string,
  eligible: boolean,
  hasPendingQuestions: boolean,
  next: () => void,
): AutoAdvance {
  const nextRef = useRef(next);
  nextRef.current = next;

  const [seenPage, setSeenPage] = useState(page);
  const [waitsForButton, setWaitsForButton] = useState(!hasPendingQuestions);
  if (seenPage !== page) {
    setSeenPage(page);
    setWaitsForButton(!hasPendingQuestions);
  }

  const autoAdvances = eligible && !waitsForButton;
  const triggered = autoAdvances && !hasPendingQuestions;
  useEffect(() => {
    if (!triggered) return;
    const timer = setTimeout(() => nextRef.current(), DELAY_MS);
    return () => clearTimeout(timer);
  }, [triggered]);

  return { autoAdvances, onInput: () => setWaitsForButton(false) };
}

// L'avancement automatique ne vaut que pour une page autonome : un seul choix
// unique, affiché seul. Une page composée garde son bouton, même complète :
// plusieurs blocs, une case, une saisie, ou un sous-champ révélé par la
// réponse (REFERENTIEL/03 § 11.3.1, D-240). Une question facultative le garde
// aussi : sinon la page partirait avant qu'on ait pu y répondre. De même une
// liste déroulante, qu'on parcourt au clavier en changeant de valeur.
export function isSingleChoicePage(
  questions: readonly AskedQuestion[],
): boolean {
  const [only, ...others] = questions;
  return only !== undefined && others.length === 0 && advancesAlone(only);
}

// Toute saisie relance l'avancement automatique, même au retour sur une page
// déjà répondue, où le bouton « Suivant » était revenu.
export function withRestart(handlers: Actions, autoAdvance: AutoAdvance) {
  return {
    ...handlers,
    autoAdvances: autoAdvance.autoAdvances,
    answer: (id: string, answer: Answer | Unanswered) => {
      autoAdvance.onInput();
      handlers.answer(id, answer);
    },
  };
}

// ---- implémentation ----

const DELAY_MS = 200;

function advancesAlone(question: AskedQuestion): boolean {
  return (
    question.kind === "single choice" &&
    !question.optional &&
    !question.dropdown
  );
}
