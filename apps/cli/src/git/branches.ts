// Les branches du dépôt : en tirer une de `staging`, lister celles qui
// attendent encore d'y être fusionnées.

import type { Invocation } from "../core/invocation.ts";
import { printError } from "../core/output.ts";
import { runProgram } from "../core/run-program.ts";
import { COMMIT_TYPES } from "./conventional-commits.ts";
import { git, stagingRef } from "./git.ts";
import { issueState } from "./issues.ts";

/** `tsp branch <type>/<sujet> [--issue <n>]` */
export function branchCommand(invocation: Invocation): number {
  const { root, args, options } = invocation;
  const [asked] = args;
  const refusal = refuseName(asked) ?? refuseIssue(root, options.issue);
  if (refusal !== undefined) {
    printError(refusal);
    return 1;
  }
  const name = withIssue(asked!, options.issue);
  const fetched = runProgram("git", ["fetch", "origin", "staging"], root);
  if (fetched !== 0) return fetched;
  const from = ["switch", "--create", name, "--no-track", "origin/staging"];
  return runProgram("git", from, root);
}

/**
 * L'issue qu'une branche sert : `feat/51-adresse` sert la 51. Le workflow
 * `close-issue.yml` lit le même numéro pour fermer l'issue à la fusion.
 */
export function issueOfBranch(branch: string): number | undefined {
  const number = /^[a-z]+\/(\d+)-/.exec(branch)?.[1];
  return number === undefined ? undefined : Number(number);
}

/**
 * Les branches locales et distantes non fusionnées dans `staging`, une fois
 * chacune. Une PR fusionnée par squash laisse sa branche « non fusionnée » aux
 * yeux de git : c'est à l'appelant de la retirer, d'après sa PR.
 */
export function unmergedBranches(root: string): string[] {
  const refs = git(root, [
    "for-each-ref",
    `--no-merged=${stagingRef(root)}`,
    "--format=%(refname:short)",
    "refs/heads",
    "refs/remotes/origin",
  ]);
  const names = refs
    .split("\n")
    .map((ref) => ref.replace(/^origin\//, ""))
    .filter((name) => name !== "" && !isPermanentBranch(name));
  return [...new Set(names)].sort();
}

/** Ce qui n'est pas un travail en cours : les branches pérennes et le pointeur du distant. */
export function isPermanentBranch(name: string): boolean {
  return PERMANENT.includes(name);
}

// ---- implémentation ----

const BRANCH_NAME = /^[a-z]+\/[a-z0-9][a-z0-9.-]*$/;

function refuseName(name: string | undefined): string | undefined {
  if (!name || !BRANCH_NAME.test(name)) {
    return "Usage : tsp branch <type>/<sujet> [--issue <n>], ex. fix/libelle-article-80.";
  }
  const type = name.split("/")[0]!;
  if (COMMIT_TYPES.includes(type)) return undefined;
  return `Type inconnu : « ${type} ». Types permis : ${COMMIT_TYPES.join(", ")}.`;
}

/** Une branche ne se tire que pour une issue ouverte. */
function refuseIssue(root: string, issue?: string): string | undefined {
  if (issue === undefined) return undefined;
  if (!/^\d+$/.test(issue))
    return `--issue attend un numéro. Reçu : « ${issue} ».`;
  const state = issueState(root, Number(issue));
  if (state === undefined) return `Aucune issue ne porte le numéro ${issue}.`;
  return state === "OPEN" ? undefined : `L'issue #${issue} est fermée.`;
}

/** `feat/adresse` pour l'issue 51 devient `feat/51-adresse`. */
function withIssue(name: string, issue?: string): string {
  if (issue === undefined) return name;
  const [type, ...subject] = name.split("/");
  return `${type}/${issue}-${subject.join("/")}`;
}

const PERMANENT = ["main", "staging", "HEAD", "origin"];
