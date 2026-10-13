// Le travail en cours : chantiers et tâches commencés, PR ouvertes, branches et
// worktrees sans issue, tickets Notion en développement ou en revue.

import type { Invocation } from "../core/invocation.ts";
import { columns, emit, section } from "../core/output.ts";
import { type PullRequest, renderPullRequests } from "../git/pull-requests.ts";
import {
  type Chantier,
  hasTache,
  readSuivi,
  renderChantiers,
  type Suivi,
} from "../issues/chantiers.ts";
import { type Lieu, renderLieu } from "../issues/lieux.ts";
import {
  renderTickets,
  type TicketsView,
  ticketsBeyondChantiers,
} from "./tickets.ts";

export type Wip = TicketsView & {
  /** Absent si `gh` ne répond pas. */
  github?: {
    /** Les chantiers dont une tâche est commencée ou faite. */
    chantiers: Chantier[];
    /** Les PR ouvertes. */
    prs: PullRequest[];
    /** Les branches et les worktrees qu'aucune issue ne suit. */
    sansIssue: Lieu[];
  };
};

/** `tsp wip` */
export async function wipCommand(invocation: Invocation): Promise<number> {
  emit(invocation.options.json, await readWip(invocation.root), renderWip);
  return 0;
}

export async function readWip(
  root: string,
  suivi: Suivi | undefined = readSuivi(root),
): Promise<Wip> {
  return {
    github: suivi && {
      chantiers: suivi.chantiers.filter((each) => each.etat === "en cours"),
      prs: suivi.prs.filter((pr) => pr.state === "OPEN"),
      sansIssue: suivi.lieux.filter((lieu) => lieu.issue === undefined),
    },
    ...(await ticketsBeyondChantiers(root, STATUTS, suivi?.chantiers ?? [])),
  };
}

export function renderWip(wip: Wip): string {
  return [
    ...renderGithub(wip.github),
    section("Tickets Notion en cours", renderTickets(wip)),
  ].join("\n\n");
}

// ---- implémentation ----

/** `Staging` n'y est pas : c'est livré, en attente de mise en production. */
const STATUTS = ["Doing Dev", "Reviewing dev"];

/** Sous chaque chantier, seules les tâches en cours : où en est le reste se lit dans `tsp issue show`. */
function renderGithub(github: Wip["github"]): string[] {
  if (!github) return [section("GitHub", "gh ne répond pas")];
  const enCours = hasTache("en cours");
  return [
    section("Chantiers en cours", renderChantiers(github.chantiers, enCours)),
    section("PR ouvertes", renderPullRequests(github.prs)),
    section("Sans issue", columns(github.sansIssue.map(renderLieu))),
  ];
}
