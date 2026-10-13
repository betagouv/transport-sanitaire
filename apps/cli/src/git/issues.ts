// Les issues du dépôt, telles que GitHub les tient : leur parente, leurs
// sous-issues, ce qui les bloque, les PR qui leur sont liées. Les lire, en
// ouvrir une, réécrire son corps.

import { captureProgram } from "../core/run-program.ts";

export type Issue = {
  number: number;
  title: string;
  url: string;
  body: string;
  labels: string[];
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

export type IssueDraft = {
  title: string;
  body: string;
  labels?: string[];
  parent?: number;
  /** Les numéros des issues qui la bloquent, séparés par des virgules. */
  blockedBy?: string;
};

/** Toutes les issues, ouvertes ou fermées. Rien si `gh` ne répond pas. */
export function readIssues(root: string): Issue[] | undefined {
  const args = ["issue", "list", "--state", "all", "--limit", "1000"];
  const result = captureProgram("gh", [...args, "--json", FIELDS], root);
  if (result.code !== 0) return undefined;
  return (JSON.parse(result.stdout) as GhIssue[]).map(toIssue);
}

/** `OPEN` ou `CLOSED`. Rien si aucune issue ne porte ce numéro. */
export function issueState(root: string, number: number): string | undefined {
  const args = ["issue", "view", String(number), "--json", "state,url"];
  const result = captureProgram("gh", args, root);
  if (result.code !== 0) return undefined;
  const found = JSON.parse(result.stdout) as { state: string; url: string };
  // `gh issue view` répond aussi pour une PR, qui partage la numérotation.
  return found.url.includes("/issues/") ? found.state : undefined;
}

/** Ouvre l'issue et rend son adresse. Crée les étiquettes qui manquent. */
export function createIssue(root: string, draft: IssueDraft): string {
  const labels = draft.labels ?? [];
  ensureLabels(root, labels);
  return gh(root, [
    "issue",
    "create",
    "--title",
    draft.title,
    "--body",
    draft.body,
    ...labels.flatMap((label) => ["--label", label]),
    ...(draft.parent === undefined ? [] : ["--parent", String(draft.parent)]),
    ...(draft.blockedBy === undefined ? [] : ["--blocked-by", draft.blockedBy]),
  ]);
}

export function writeIssueBody(
  root: string,
  number: number,
  body: string,
): void {
  gh(root, ["issue", "edit", String(number), "--body", body]);
}

// ---- implémentation ----

const FIELDS =
  "number,title,url,body,labels,state,stateReason,parent,subIssues,blockedBy,closedByPullRequestsReferences";

/** Les raisons de fermeture qui ne valent pas « fait ». */
const ABANDONED = ["NOT_PLANNED", "DUPLICATE"];

type GhRef = { number: number; state?: string };

type GhIssue = {
  number: number;
  title: string;
  url: string;
  body: string;
  labels: { name: string }[];
  state: string;
  stateReason: string;
  parent: GhRef | null;
  subIssues: { nodes: GhRef[] };
  blockedBy: { nodes: GhRef[] };
  closedByPullRequestsReferences: GhRef[];
};

/** Ce que `gh` répond. Lève une erreur s'il échoue. */
function gh(root: string, args: string[]): string {
  const result = captureProgram("gh", args, root);
  if (result.code !== 0) {
    throw new Error(`gh ${args.slice(0, 2).join(" ")} : ${result.stderr}`);
  }
  return result.stdout;
}

/** `gh issue create` refuse une étiquette que le dépôt ne connaît pas. */
function ensureLabels(root: string, labels: string[]): void {
  if (labels.length === 0) return;
  const listed = gh(root, [
    "label",
    "list",
    "--limit",
    "1000",
    "--json",
    "name",
  ]);
  const known = (JSON.parse(listed) as { name: string }[]).map(
    (label) => label.name,
  );
  for (const label of labels) {
    if (!known.includes(label)) gh(root, ["label", "create", label]);
  }
}

function toIssue(issue: GhIssue): Issue {
  const closed = issue.state === "CLOSED";
  return {
    number: issue.number,
    title: issue.title,
    url: issue.url,
    body: issue.body,
    labels: issue.labels.map((label) => label.name),
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
