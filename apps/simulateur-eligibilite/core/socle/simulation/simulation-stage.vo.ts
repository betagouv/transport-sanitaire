// L'étape d'une simulation : où elle en est, et laquelle suit ou précède.
// Une valeur : chaque transition de la simulation en donne une autre
// (`simulation.entity.ts`).

import type { Answers } from "../questionnaire-engine/index.ts";
import type { Preconisation } from "./preconisation.vo.ts";

/** Ce que le verrou fige : les réponses d'avant, et leur préconisation. */
export class Lock {
  readonly answers: Answers;
  readonly preconisation: Preconisation;

  constructor(answers: Answers, preconisation: Preconisation) {
    this.answers = answers;
    this.preconisation = preconisation;
  }
}

type StageName = "questionnaire" | "resultat" | "complement" | "cerfa";

/**
 * Où en est une simulation : avant le verrou, le questionnaire puis son
 * résultat ; après, le complément puis le cerfa. Le verrou est une étape, pas
 * un drapeau : après lui, l'étape porte ce qu'il a figé.
 */
export class SimulationStage {
  static questionnaire(): SimulationStage {
    return new SimulationStage("questionnaire");
  }

  static resultat(): SimulationStage {
    return new SimulationStage("resultat");
  }

  static complement(lock: Lock): SimulationStage {
    return new SimulationStage("complement", lock);
  }

  /** `completedAt` : le jour où le complément a été validé. */
  static cerfa(lock: Lock, completedAt: Date): SimulationStage {
    return new SimulationStage("cerfa", lock, completedAt);
  }

  readonly name: StageName;
  readonly #lock: Lock | undefined;
  readonly #completedAt: Date | undefined;

  private constructor(name: StageName, lock?: Lock, completedAt?: Date) {
    this.name = name;
    this.#lock = lock;
    this.#completedAt = completedAt;
  }

  /** Le verrou est-il franchi ? Le complément et le cerfa portent ce qu'il a figé. */
  isLocked(): boolean {
    return this.#lock !== undefined;
  }

  /** Ce que le verrou a figé. Avant lui, rien. */
  get locked(): Lock {
    if (!this.#lock) throw new Error(`L'étape ${this.name} précède le verrou.`);
    return this.#lock;
  }

  /** Le jour du cerfa : figé tant que le complément n'est pas validé à nouveau. */
  get completedAt(): Date {
    if (!this.#completedAt)
      throw new Error(`L'étape ${this.name} n'est pas le cerfa.`);
    return this.#completedAt;
  }

  /** L'étape qui s'ouvre quand la page validée n'a pas de suivante. */
  next(on: Date): SimulationStage {
    if (this.name === "questionnaire") return SimulationStage.resultat();
    if (this.name === "complement")
      return SimulationStage.cerfa(this.locked, on);
    return this;
  }

  /** L'étape que « Précédent » rouvre depuis un résultat : celle qui le précède. */
  previous(): SimulationStage {
    if (this.name === "resultat") return SimulationStage.questionnaire();
    if (this.name === "cerfa") return SimulationStage.complement(this.locked);
    return this;
  }
}
