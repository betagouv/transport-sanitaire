// Les issues du dépôt, telles que GitHub les tient : leur parente, leurs
// sous-issues, ce qui les bloque, les PR qui leur sont liées.

import { captureProgram } from "../core/run-program.ts";

export type Issue = {
  number: number;
  title: string;
  url: string;
  closed: boolean;
  /** Fermée sans avoir été faite. */
  abandoned: boolean;
  parent?: number;
  subIssues: number[];
  /** Les issues encore ouvertes qui la bloquent. */
  blockedBy: number[];
  /** Les PR que GitHub lui lie. */
  pullRequests: number[];
};

/** Toutes les issues, ouvertes ou fermées. Rien si `gh` ne répond pas. */
export function readIssues(root: string): Issue[] | undefined {
  const args = ["issue", "list", "--state", "all", "--limit", "1000"];
  const result = captureProgram("gh", [...args, "--json", FIELDS], root);
  if (result.code !== 0) return undefined;
  return (JSON.parse(result.stdout) as GhIssue[]).map(toIssue);
}

// ---- implémentation ----

const FIELDS =
  "number,title,url,state,stateReason,parent,subIssues,blockedBy,closedByPullRequestsReferences";

/** Les raisons de fermeture qui ne valent pas « fait ». */
const ABANDONED = ["NOT_PLANNED", "DUPLICATE"];

type GhRef = { number: number; state?: string };

type GhIssue = {
  number: number;
  title: string;
  url: string;
  state: string;
  stateReason: string;
  parent: GhRef | null;
  subIssues: { nodes: GhRef[] };
  blockedBy: { nodes: GhRef[] };
  closedByPullRequestsReferences: GhRef[];
};

function toIssue(issue: GhIssue): Issue {
  const closed = issue.state === "CLOSED";
  return {
    number: issue.number,
    title: issue.title,
    url: issue.url,
    closed,
    abandoned: closed && ABANDONED.includes(issue.stateReason),
    parent: issue.parent?.number,
    subIssues: issue.subIssues.nodes.map((sub) => sub.number),
    blockedBy: issue.blockedBy.nodes
      .filter((blocker) => blocker.state !== "CLOSED")
      .map((blocker) => blocker.number),
    pullRequests: issue.closedByPullRequestsReferences.map((pr) => pr.number),
  };
}
