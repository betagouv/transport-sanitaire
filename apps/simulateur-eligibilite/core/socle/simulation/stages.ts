// Les étapes d'une simulation, et ce qui la fait passer de l'une à l'autre :
// lire des réponses à une étape, verrouiller, achever, rouvrir, reprendre.
// La simulation s'en sert à chaque transition (`simulation.ts`).

import type { CoreModel, Preconisation } from "../model.ts";
import {
  type Answers,
  type Page,
  pagesOf,
  Questionnaire,
  type Reading,
} from "../questionnaire-engine/index.ts";
import { preconisationFrom } from "./preconisation.ts";

/** Ce que le verrou fige : les réponses d'avant, et leur préconisation. */
export type Locked = { answers: Answers; preconisation: Preconisation };

/**
 * Où en est une simulation : avant le verrou, le questionnaire puis son
 * résultat ; après, le complément puis le cerfa. Le verrou est une étape, pas
 * un drapeau : après lui, l'étape porte ce qu'il a figé.
 */
export type Stage =
  | { name: "questionnaire" }
  | { name: "resultat" }
  | { name: "complement"; locked: Locked }
  | {
      name: "cerfa";
      locked: Locked;
      /** Le jour où le complément a été validé : figé tant qu'il ne l'est pas à nouveau. */
      completedAt: Date;
    };

/**
 * Ces réponses, lues à cette étape. Avant le verrou : les parties qui mènent
 * au premier résultat. Après : toutes les pages, sous les cibles que le verrou
 * a figées ; les questions d'après le verrou les lisent.
 */
export function readAt(
  core: CoreModel,
  stage: Stage,
  answers: Answers,
): Reading {
  const before = pagesOf(core.questionnaire);
  if (!("locked" in stage)) {
    return new Questionnaire(before, core.relevance).readWith(answers);
  }
  return new Questionnaire(
    [...before, ...core.complement.pages],
    core.relevance,
  ).readWith(answers, stage.locked.preconisation.cibles);
}

/**
 * Ce que verrouille cette lecture : les réponses des questions validées, et
 * leur préconisation. Une réponse qu'un retour en arrière a laissée sans
 * objet ne passe pas le verrou : rien de ce qui suit ne la lit.
 */
export function lockOf(core: CoreModel, reading: Reading): Locked {
  const answers = reading.validated.answers();
  const before = new Questionnaire(pagesOf(core.questionnaire), core.relevance);
  return {
    answers,
    preconisation: preconisationFrom(core, before.readWith(answers)),
  };
}

/** Une page de cette lecture attend-elle encore une réponse à ces réponses ? */
export function pendingIn(reading: Reading, answers: Answers) {
  return (page: Page): boolean =>
    reading
      .questionsOn(page)
      .some((question) => !question.isAnsweredBy(answers[question.id]));
}

/** L'étape qui s'ouvre quand la page validée n'a pas de suivante. */
export function endOf(stage: Stage, on: Date): Stage {
  if (stage.name === "questionnaire") return { name: "resultat" };
  if (stage.name === "complement") {
    return { name: "cerfa", locked: stage.locked, completedAt: on };
  }
  return stage;
}

/** L'étape que « Précédent » rouvre depuis un résultat : celle qui le précède. */
export function reopenedOf(stage: Stage): Stage {
  if (stage.name === "resultat") return { name: "questionnaire" };
  if (stage.name === "cerfa")
    return { name: "complement", locked: stage.locked };
  return stage;
}

/**
 * L'étape où ces réponses mènent : le résultat qu'elles atteignent, ou le
 * questionnaire qu'elles laissent incomplet. Répondre à une question d'après
 * le verrou, c'est l'avoir franchi : le cerfa, ou le complément.
 */
export function whereAnswersLead(
  core: CoreModel,
  answers: Answers,
  on: Date,
): Stage {
  const after = core.complement.pages.flatMap((page) =>
    page.questions.map(({ id }) => id),
  );
  const pastLock = Object.keys(answers).some((id) => after.includes(id));
  if (!pastLock) {
    const reading = readAt(core, { name: "questionnaire" }, answers);
    return { name: reading.isComplete() ? "resultat" : "questionnaire" };
  }
  const before = Object.fromEntries(
    Object.entries(answers).filter(([id]) => !after.includes(id)),
  );
  const locked = lockOf(core, readAt(core, { name: "questionnaire" }, before));
  const complement: Stage = { name: "complement", locked };
  return readAt(core, complement, answers).isComplete()
    ? endOf(complement, on)
    : complement;
}
