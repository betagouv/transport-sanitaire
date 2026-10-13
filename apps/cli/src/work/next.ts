// Le travail à prendre : les tâches que rien ne bloque et que personne n'a
// commencées, et les tickets Notion prêts à développer. Le travail en cours le
// précède : on ne choisit pas la suite sans voir ce qui est déjà commencé.

import type { Invocation } from "../core/invocation.ts";
import { emit, section } from "../core/output.ts";
import {
  type Chantier,
  hasTache,
  isOpen,
  readSuivi,
  renderChantiers,
} from "../issues/chantiers.ts";
import {
  renderTickets,
  type TicketsView,
  ticketsBeyondChantiers,
} from "./tickets.ts";
import { readWip, renderWip, type Wip } from "./wip.ts";

/** `tsp next` */
export async function nextCommand(invocation: Invocation): Promise<number> {
  const { root, options } = invocation;
  const suivi = readSuivi(root);
  const chantiers = suivi?.chantiers ?? [];
  const next: Next = {
    wip: await readWip(root, suivi),
    aPrendre: chantiers.filter(isReady).filter(A_PRENDRE),
    ...(await ticketsBeyondChantiers(root, STATUTS, chantiers)),
  };
  emit(options.json, next, render);
  return 0;
}

// ---- implémentation ----

type Next = TicketsView & {
  wip: Wip;
  /** Les chantiers ouverts qui ont une tâche à prendre. */
  aPrendre: Chantier[];
};

const STATUTS = ["Ready To Dev"];

/** Ni bloquée, ni commencée. */
const A_PRENDRE = hasTache("à faire");

/** Un brouillon n'est pas à prendre : son cadrage n'est pas fini. */
function isReady(chantier: Chantier): boolean {
  return isOpen(chantier) && !chantier.brouillon;
}

function render(next: Next): string {
  return [
    renderWip(next.wip),
    section("Tâches à prendre", renderChantiers(next.aPrendre, A_PRENDRE)),
    section("Tickets Notion à prendre", renderTickets(next)),
  ].join("\n\n");
}
