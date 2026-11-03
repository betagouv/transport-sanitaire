// L'écran sur lequel le parcours s'ouvre, selon les réponses déjà données.
//
// Une seed n'est qu'un pré-remplissage. À réponses égales, le parcours est dans
// l'état qu'un prescripteur aurait laissé, « Précédent » et verrou compris.

import type { Answers } from "../../../core/socle/questionnaire-engine/question/question";
import type {
  QuestionnaireState,
  Reading,
} from "../../../core/socle/questionnaire-engine/questionnaire";
import {
  type Locked,
  Simulation,
} from "../../../core/socle/simulation/simulation";
import type { Model } from "../model";

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
  const { reading } = Simulation.of(model.core, answers);
  const state = stateOf(reading, answers);
  if (!reading.isComplete()) return { name: "questionnaire", resume: state };
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
  const part = model.core.complement;
  const after = part.pages.flatMap((page) => page.questions.map((q) => q.id));
  if (!after.some((id) => answers[id] !== undefined)) return undefined;
  const before = Object.fromEntries(
    Object.entries(answers).filter(([id]) => !after.includes(id)),
  );
  const locked = Simulation.of(model.core, before).lock();
  const form = Simulation.of(model.core, locked.answers).read(new Date());
  if (form(model.cerfa.form) === null) return undefined;
  const { reading } = Simulation.afterLock(model.core, locked, answers);
  const state = stateOf(reading, answers);
  return reading.isComplete()
    ? { name: "cerfa", locked, previousState: state, completedAt: new Date() }
    : { name: "complement", locked, resume: state };
}

// L'état qu'aurait laissé un prescripteur ayant donné ces réponses.
function stateOf(read: Reading, answers: Answers): QuestionnaireState {
  return { answers, page: read.openPage().id };
}
