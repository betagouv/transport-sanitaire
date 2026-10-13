// Où un travail se trouve : sa branche, son worktree, sa PR, et l'issue qu'il
// sert.

import { isPermanentBranch, unmergedBranches } from "../git/branches.ts";
import type { Issue } from "../git/issues.ts";
import type { PullRequest } from "../git/pull-requests.ts";
import { listWorktrees, type Worktree } from "../git/worktrees.ts";

export type Lieu = {
  /** Absente sur un worktree à tête détachée. */
  branch?: string;
  /** Le dossier du worktree, relatif au clone principal. */
  worktree?: string;
  pr?: PullRequest;
  /** Lue dans le nom `type/<n>-sujet`, sinon dans la PR que GitHub lie à une issue. */
  issue?: number;
};

/**
 * Les travaux en cours : les branches non fusionnées, celles d'un worktree,
 * celles d'une PR ouverte. Une branche dont la PR est fusionnée n'en est plus
 * un, sauf si un worktree la garde.
 */
export function readLieux(
  root: string,
  issues: Issue[],
  prs: PullRequest[],
): Lieu[] {
  const worktrees = listWorktrees(root);
  const branches = new Set([
    ...unmergedBranches(root),
    ...worktrees.flatMap((worktree) => worktree.branch ?? []),
    ...prs.filter(isOpen).map((pr) => pr.branch),
  ]);
  const onBranch = [...branches]
    .filter((branch) => !isPermanentBranch(branch))
    .sort()
    .map((branch) => lieuOf(branch, worktrees, prs, issues));
  const detached = worktrees
    .filter((worktree) => worktree.branch === undefined)
    .map((worktree): Lieu => ({ worktree: worktree.dir }));
  return [...onBranch, ...detached].filter(
    (lieu) => lieu.worktree !== undefined || lieu.pr?.state !== "MERGED",
  );
}

/** Les cellules d'un lieu : sa branche, son worktree, sa PR. */
export function renderLieu(lieu: Lieu | undefined): string[] {
  if (!lieu) return [];
  return [
    lieu.branch ?? "tête détachée",
    lieu.worktree ?? "",
    lieu.pr ? `PR #${lieu.pr.number}${PR_STATES[lieu.pr.state] ?? ""}` : "",
  ];
}

// ---- implémentation ----

/** `feat/51-adresse` sert l'issue 51. */
const ISSUE_IN_BRANCH = /^[a-z]+\/(\d+)-/;

/** Une PR ouverte se passe de précision. */
const PR_STATES: Record<string, string> = {
  MERGED: " fusionnée",
  CLOSED: " fermée",
};

function lieuOf(
  branch: string,
  worktrees: Worktree[],
  prs: PullRequest[],
  issues: Issue[],
): Lieu {
  const pr = pullRequestOf(branch, prs);
  const named = ISSUE_IN_BRANCH.exec(branch)?.[1];
  const linked = issues.find(
    (issue) => pr !== undefined && issue.pullRequests.includes(pr.number),
  );
  return {
    branch,
    worktree: worktrees.find((worktree) => worktree.branch === branch)?.dir,
    pr,
    issue: named === undefined ? linked?.number : Number(named),
  };
}

/** La PR ouverte de la branche, sinon sa plus récente. */
function pullRequestOf(
  branch: string,
  prs: PullRequest[],
): PullRequest | undefined {
  const own = prs
    .filter((pr) => pr.branch === branch)
    .sort((a, b) => b.number - a.number);
  return own.find(isOpen) ?? own[0];
}

function isOpen(pr: PullRequest): boolean {
  return pr.state === "OPEN";
}
