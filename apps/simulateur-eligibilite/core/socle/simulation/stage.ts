// L'étape d'une simulation : avant le verrou, le questionnaire puis son
// résultat ; après, le complément puis le cerfa. Ce que chaque étape lit et
// pose, ce qu'un verrou fige, et l'étape où des réponses mènent.

import type { CoreModel, Preconisation } from "../model.ts";
import {
  type Answers,
  type Page,
  pagesOf,
} from "../questionnaire-engine/question/question.ts";
import {
  Questionnaire,
  type Reading,
} from "../questionnaire-engine/questionnaire.ts";
import { preconisationFrom } from "./preconisation.ts";

/** Ce que le verrou fige : les réponses d'avant, et leur préconisation. */
export type Locked = { answers: Answers; preconisation: Preconisation };

/**
 * Où en est une simulation. Le verrou est une étape, pas un drapeau : après
 * lui, l'étape porte ce qu'il a figé.
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
 * Les pages que l'étape pose, parmi celles qui posent au moins une question.
 * Après le verrou, celles du complément : rien d'avant ne se repose.
 */
export function pagesAt(
  core: CoreModel,
  stage: Stage,
  reading: Reading,
): readonly Page[] {
  const asked = reading.askedPages();
  if (!("locked" in stage)) return asked;
  return asked.filter((page) => core.complement.pages.includes(page));
}

/**
 * La page où un prescripteur ayant donné ces réponses se trouverait : la
 * première de l'étape qui attend une réponse, sinon la dernière. Une seed
 * rouvre ainsi sur sa page, avec un « Précédent ».
 */
export function openPageAt(
  core: CoreModel,
  stage: Stage,
  reading: Reading,
  answers: Answers,
): Page {
  const pages = pagesAt(core, stage, reading);
  const pending = pages.find((page) =>
    reading
      .questionsOn(page)
      .some((question) => !question.isAnsweredBy(answers[question.id])),
  );
  const open = pending ?? pages.at(-1);
  if (!open) throw new Error("Cette étape ne pose aucune page.");
  return open;
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
 * le verrou, c'est l'avoir franchi : le cerfa, ou le complément. Une seed
 * n'est qu'un pré-remplissage : à réponses égales, le parcours est dans l'état
 * qu'un prescripteur aurait laissé, « Précédent » et verrou compris. `on` : le
 * jour du cerfa, si elles y mènent.
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
