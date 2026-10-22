// L'écran sur lequel le parcours s'ouvre, selon les réponses déjà données.
//
// Une seed n'est qu'un pré-remplissage. À réponses égales, le parcours est dans
// l'état qu'un utilisateur aurait laissé, « Précédent » et verrou compris.

import { type Model, type Preconisation, preconisationOf } from "../model";
import { validatedQuestions } from "../questionnaire-engine/asked-questions";
import { type Answers, pagesOf } from "../questionnaire-engine/question";
import type { QuestionnaireState } from "../questionnaire-engine/questionnaire";
import { stateAfterAnswers } from "../questionnaire-engine/questionnaire";

/** Ce que le verrou fige : les réponses d'avant, et leur préconisation. */
export type Locked = { answers: Answers; preconisation: Preconisation };

/**
 * Verrouille ces réponses : n'en garde que celles des questions validées, et
 * leur préconisation. Une réponse qu'un retour en arrière a laissée sans objet
 * ne passe pas le verrou : rien de ce qui suit ne la lit.
 */
export function lock(model: Model, answers: Answers): Locked {
  const pages = pagesOf(model.transportAndEligibility.parts);
  const acquired = Object.fromEntries(
    Object.entries(validatedQuestions(pages, answers)).flatMap(([id, seen]) =>
      seen?.answer === undefined ? [] : [[id, seen.answer]],
    ),
  );
  return { answers: acquired, preconisation: preconisationOf(model, acquired) };
}

// `previousState` est le questionnaire derrière un résultat : « Précédent » le
// rouvre. Après le verrou, il n'y a plus rien à rouvrir avant lui.
export type Screen =
  | { name: "questionnaire"; resume?: QuestionnaireState }
  | { name: "resultat"; previousState: QuestionnaireState }
  | { name: "complement"; locked: Locked; resume?: QuestionnaireState }
  | {
      name: "cerfa";
      locked: Locked;
      previousState: QuestionnaireState;
      /** Le jour où le complément a été validé : figé tant qu'il ne l'est pas à nouveau. */
      completedAt: Date;
    };

/**
 * Sans réponse, le premier questionnaire. Sinon, là où ces réponses mènent : la
 * première page qu'elles laissent sans réponse, ou le résultat qu'elles
 * atteignent.
 */
export function startingScreen(model: Model, answers: Answers | null): Screen {
  if (!answers) return { name: "questionnaire" };
  const before = pagesOf(model.transportAndEligibility.parts);
  const { complete, ...state } = stateAfterAnswers(before, answers);
  if (!complete) return { name: "questionnaire", resume: state };
  return (
    screenAfterLock(model, answers) ?? {
      name: "resultat",
      previousState: state,
    }
  );
}

// ---- implémentation ----

/** Le verrou n'est pas franchi : on reste sur le premier résultat. */
type NotPastLock = undefined;

// Répondre à une question d'après le verrou, c'est l'avoir franchi. Sans une
// telle réponse, ou sans cerfa à compléter, on reste sur le premier résultat.
function screenAfterLock(model: Model, answers: Answers): Screen | NotPastLock {
  const { part, form } = model.cerfa;
  const after = part.pages.flatMap((page) => page.questions.map((q) => q.id));
  if (!after.some((id) => answers[id] !== undefined)) return undefined;
  const before = Object.fromEntries(
    Object.entries(answers).filter(([id]) => !after.includes(id)),
  );
  const locked = lock(model, before);
  const { cibles } = locked.preconisation;
  if (form(cibles) === null) return undefined;
  const { complete, ...state } = stateAfterAnswers(part.pages, answers, cibles);
  return complete
    ? { name: "cerfa", locked, previousState: state, completedAt: new Date() }
    : { name: "complement", locked, resume: state };
}
