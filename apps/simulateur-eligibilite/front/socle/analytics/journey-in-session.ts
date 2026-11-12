// Le journal des parcours de la session. C'est ici que le questionnaire
// déclenche les use cases du journal. Les événements qui suivent le début
// garderont ici le parcours ouvert.
//
// Rien ne part tant que `main.tsx` n'a pas donné le journal : les tests et les
// écrans qui ne le donnent pas n'écrivent dans aucun journal.

import { rattachementEnSession } from "../rattachement";
import type { Journal } from "./journal.port";
import { StartASimulation } from "./start-a-simulation.usecase";

export function initJournal(given: Journal): void {
  journal = given;
}

/** Ouvre une simulation, et le signale au journal. */
export function startASimulation(): void {
  new StartASimulation(journal).execute(rattachementEnSession());
}

// ---- implémentation ----

let journal: Journal = { record: recordNothing };

async function recordNothing() {}
