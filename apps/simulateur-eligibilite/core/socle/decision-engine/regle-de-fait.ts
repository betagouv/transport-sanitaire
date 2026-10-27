// Une règle de fait : une condition, l'état qu'elle donne au fait, et sa
// raison. Elle établit le fait si la condition tient, et laisse la main sinon.
//
//   export const UNE_SORTIE_VERS_LA_PRISON = uneRegle().nonSi(
//     sousType.is("2_SORTIE").and(cadre.checked("10_RETOUR_PENITENTIAIRE")),
//     "Sortie définitive vers la prison.",
//   );
//
// Sa provenance cite ce que lit la condition, puis la raison : « Q2.1.g :
// « 2_SORTIE », Q2.2.1.b : « 10_RETOUR_PENITENTIAIRE ». Sortie définitive vers
// la prison. ». Une réponse absente se cite « sans réponse ». Un fait place la
// règle avec `applique` (`fait-builder.ts`).

import {
  type Condition,
  type Reading,
  type Reads,
  Value,
} from "../questionnaire-engine/condition.ts";
import type { Box, Choice } from "../questionnaire-engine/given-answers.ts";
import type { Answer } from "../questionnaire-engine/question.ts";
import type { ValidatedAnswer } from "../questionnaire-engine/validated-answers.ts";
import { Fait } from "./fait.ts";

/** La règle n'établit pas le fait : elle laisse la main à la suivante. */
export type PassesOn = undefined;

/** Une règle de fait : ce qu'elle donne au fait, ou rien. */
export class RegleDeFait extends Value<Fait | PassesOn> {}

/** Ce qu'une règle donne au fait quand sa condition tient. */
export type Etat = "oui" | "non" | "inconnu";

/** Une case, lue comme le contrat de l'éditeur la lit. */
export type AnswerOf<Given extends Answer> = Value<ValidatedAnswer<Given>> & {
  offered(option: Choice<Given> | Box<Given>): Condition;
  checked(box: Box<Given>): Condition;
};

/** Les règles qu'on écrit : une condition, un état, une raison. */
export const regles = {
  /** Le fait vaut « oui » si `condition` tient. */
  ouiSi: (condition: Condition, raison?: string) =>
    regle("oui", condition, raison),
  /** Le fait vaut « non » si `condition` tient. */
  nonSi: (condition: Condition, raison?: string) =>
    regle("non", condition, raison),
  /**
   * Le fait reste inconnu si `condition` tient, sans laisser la main : une
   * réponse attendue plus loin le dira.
   */
  inconnuSi: (condition: Condition, raison?: string) =>
    regle("inconnu", condition, raison),
  /**
   * « Non » si la case se proposait sans être cochée : la situation est
   * écartée. La raison dit, par défaut, ce qu'il en est de la case.
   */
  nonSiEcartee: <Given extends Answer>(
    answer: AnswerOf<Given>,
    box: Box<Given>,
    raison = `« ${box} » proposée, non cochée.`,
  ) => regle("non", answer.offered(box).and(answer.checked(box).not()), raison),
};

/**
 * Une règle partagée entre plusieurs faits, qu'ils placent avec `applique` :
 * `uneRegle().nonSi(condition, raison)`. Elle ne porte qu'une règle.
 */
export function uneRegle(): typeof regles {
  return regles;
}

/**
 * Ce que lit `reads` dans cette lecture, pour une provenance : « Q2.5 :
 * « 1_TRANSFERT », fait_permission : « non » ». Les questions d'abord, puis les
 * faits.
 */
function citation(reads: Reads, reading: Reading): string {
  return [
    ...reads.questions.map((id) => cited(id, reading.answer(id).value)),
    ...reads.faits.map((nom) => citedFait(nom, reading.fait(nom) as Fait)),
  ].join(", ");
}

// ---- implémentation ----

function regle(etat: Etat, condition: Condition, raison?: string) {
  return new RegleDeFait(condition.reads, (reading) =>
    condition.in(reading)
      ? Fait[etat](provenance(citation(condition.reads, reading), raison))
      : undefined,
  );
}

// La citation, puis la raison.
function provenance(cites: string, raison: string | undefined): string {
  const cite = cites === "" ? "" : `${cites}.`;
  return [cite, raison ?? ""].filter((part) => part !== "").join(" ");
}

function cited(id: string, value: unknown): string {
  if (value === undefined) return `${id} : sans réponse`;
  if (Array.isArray(value) && value.length === 0)
    return `${id} : aucune case cochée`;
  return `${id} : « ${formatted(value)} »`;
}

function citedFait(nom: string, fait: Fait<boolean | number | string>): string {
  if (fait.isInconnu()) return `${nom} : inconnu`;
  const value =
    fait.value === true ? "oui" : fait.value === false ? "non" : fait.value;
  return `${nom} : « ${value} »`;
}

function formatted(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "oui" : "non";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}
