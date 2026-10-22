// L'écran sur lequel le parcours s'ouvre, selon les réponses déjà données.
//
// Une seed n'est qu'un pré-remplissage. À réponses égales, le parcours est dans
// l'état qu'un utilisateur aurait laissé, « Précédent » et verrou compris.

import { type Preconisation, preconisationOf } from "../../../core/socle/model";
import {
  type Answers,
  pagesOf,
} from "../../../core/socle/questionnaire-engine/question";
import {
  Questionnaire,
  type QuestionnaireState,
  type Reading,
} from "../../../core/socle/questionnaire-engine/questionnaire";
import type { Model } from "../model";

/** Ce que le verrou fige : les réponses d'avant, et leur préconisation. */
export type Locked = { answers: Answers; preconisation: Preconisation };

/**
 * Verrouille ces réponses : n'en garde que celles des questions validées, et
 * leur préconisation. Une réponse qu'un retour en arrière a laissée sans objet
 * ne passe pas le verrou : rien de ce qui suit ne la lit.
 */
export function lock(model: Model, answers: Answers): Locked {
  const questionnaire = new Questionnaire(pagesOf(model.core.questionnaire));
  const acquired = questionnaire.readWith(answers).validated.answers();
  return {
    answers: acquired,
    preconisation: preconisationOf(model.core, acquired),
  };
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
  const questionnaire = new Questionnaire(pagesOf(model.core.questionnaire));
  const read = questionnaire.readWith(answers);
  const state = stateOf(read, answers);
  if (!read.isComplete()) return { name: "questionnaire", resume: state };
  return (
    screenAfterLock(model, answers) ?? {
      name: "resultat",
      previousState: state,
    }
  );
}

// ---- implémentation ----

// Répondre à une question d'après le verrou, c'est l'avoir franchi. Sans une
// telle réponse, ou sans cerfa à compléter, on reste sur le premier résultat.
function screenAfterLock(model: Model, answers: Answers): Screen | undefined {
  const part = model.core.complement;
  const { form } = model.cerfa;
  const after = part.pages.flatMap((page) => page.questions.map((q) => q.id));
  if (!after.some((id) => answers[id] !== undefined)) return undefined;
  const before = Object.fromEntries(
    Object.entries(answers).filter(([id]) => !after.includes(id)),
  );
  const locked = lock(model, before);
  const { cibles } = locked.preconisation;
  if (form(cibles) === null) return undefined;
  const read = new Questionnaire(part.pages).readWith(answers, cibles);
  const state = stateOf(read, answers);
  return read.isComplete()
    ? { name: "cerfa", locked, previousState: state, completedAt: new Date() }
    : { name: "complement", locked, resume: state };
}

// L'état qu'aurait laissé un utilisateur ayant donné ces réponses.
function stateOf(read: Reading, answers: Answers): QuestionnaireState {
  return { answers, page: read.openPage().id };
}
