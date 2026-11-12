// Le journal des parcours de la session. C'est ici que le questionnaire
// déclenche les use cases du journal. Les événements qui suivent le début
// garderont ici le parcours ouvert.
//
// Rien ne part tant que `main.tsx` n'a pas donné le use case, instancié par le
// conteneur : les tests et les écrans qui ne le donnent pas n'écrivent dans
// aucun journal.

import { rattachementEnSession } from "../rattachement";
import type { StartASimulation } from "./start-a-simulation.usecase";

export function initJournal(given: StartASimulation): void {
  starting = given;
}

/** Ouvre une simulation, et le signale au journal. */
export function startASimulation(): void {
  starting?.execute(rattachementEnSession());
}

// ---- implémentation ----

let starting: StartASimulation | undefined;
