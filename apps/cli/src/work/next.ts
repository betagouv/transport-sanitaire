// Le travail à prendre : les tâches que rien ne bloque et que personne n'a
// commencées, les specs en `todo` puis en `backlog`, et les tickets Notion
// prêts à développer. Le travail en cours le précède : on ne choisit pas
// la suite sans voir ce qui est déjà commencé.

import type { Invocation } from "../core/invocation.ts";
import { emit, section } from "../core/output.ts";
import {
  type Chantier,
  hasTache,
  isOpen,
  readSuivi,
  renderChantiers,
} from "../issues/chantiers.ts";
import { listSpecs, renderSpecs, type Spec } from "../specs/trackers.ts";
import {
  renderTickets,
  type TicketsView,
  ticketsBeyondSpecs,
} from "./tickets.ts";
import { readWip, renderWip, type Wip } from "./wip.ts";

/** `tsp next` */
export async function nextCommand(invocation: Invocation): Promise<number> {
  const { root, options } = invocation;
  const all = listSpecs(root);
  const specs = [
    ...all.filter((spec) => spec.etat === "todo"),
    ...all.filter((spec) => spec.etat === "backlog"),
  ];
  const suivi = readSuivi(root);
  const next: Next = {
    wip: await readWip(root, suivi),
    aPrendre: suivi?.chantiers.filter(isOpen).filter(A_PRENDRE) ?? [],
    specs,
    ...(await ticketsBeyondSpecs(root, STATUTS, all)),
  };
  emit(options.json, next, render);
  return 0;
}

// ---- implémentation ----

type Next = TicketsView & {
  wip: Wip;
  /** Les chantiers ouverts qui ont une tâche à prendre. */
  aPrendre: Chantier[];
  specs: Spec[];
};

/** Ni bloquée, ni commencée. */
const A_PRENDRE = hasTache("à faire");

const STATUTS = ["Ready To Dev"];

function render(next: Next): string {
  return [
    renderWip(next.wip),
    section("Tâches à prendre", renderChantiers(next.aPrendre, A_PRENDRE)),
    section("Specs à prendre", renderSpecs(next.specs)),
    section("Tickets Notion à prendre", renderTickets(next)),
  ].join("\n\n");
}
