// Les PR du dépôt : les lister, en ouvrir une vers `staging`, suivre celle de
// la branche courante.

import fs from "node:fs";
import path from "node:path";
import type { Invocation } from "../core/invocation.ts";
import { columns, emit, printError, section } from "../core/output.ts";
import { captureProgram, runProgram } from "../core/run-program.ts";
import { issueOfBranch } from "./branches.ts";
import { isConventionalSubject } from "./conventional-commits.ts";
import { git, stagingRef } from "./git.ts";

export type PullRequest = {
  number: number;
  title: string;
  branch: string;
  base: string;
  url: string;
  /** `OPEN`, `MERGED`, ou `CLOSED` pour une PR fermée sans fusion. */
  state: string;
};

/** Toutes les PR, quel que soit leur état. Rien si `gh` ne répond pas. */
export function listPullRequests(root: string): PullRequest[] | undefined {
  const fields = "number,title,headRefName,baseRefName,url,state";
  const args = ["pr", "list", "--state", "all", "--limit", "1000"];
  const result = captureProgram("gh", [...args, "--json", fields], root);
  if (result.code !== 0) return undefined;
  return (JSON.parse(result.stdout) as GhPullRequest[]).map((pr) => ({
    number: pr.number,
    title: pr.title,
    branch: pr.headRefName,
    base: pr.baseRefName,
    url: pr.url,
    state: pr.state,
  }));
}

export function renderPullRequests(prs: PullRequest[]): string {
  return columns(
    prs.map((pr) => [`#${pr.number}`, pr.title, `${pr.branch} → ${pr.base}`]),
  );
}

/** `tsp pr`, `tsp pr status` */
export function prCommand(invocation: Invocation): number {
  const [verb] = invocation.args;
  if (verb === undefined) return openPullRequest(invocation);
  if (verb === "status") return showStatus(invocation);
  printError(`Usage : tsp pr, tsp pr status. Reçu : « ${verb} ».`);
  return 1;
}

// ---- implémentation ----

/** La seule cible permise : c'est ce qui applique GIT-009 côté PR. */
const BASE = "staging";

type GhPullRequest = {
  number: number;
  title: string;
  headRefName: string;
  baseRefName: string;
  url: string;
  state: string;
};

type Check = {
  name?: string;
  context?: string;
  status?: string;
  conclusion?: string;
  state?: string;
};

type Status = GhPullRequest & {
  reviewDecision: string;
  statusCheckRollup: Check[];
};

function openPullRequest(invocation: Invocation): number {
  const { root, options } = invocation;
  const branch = git(root, ["branch", "--show-current"]);
  if (branch === "" || branch === "main" || branch === BASE) {
    printError(`Pas de PR depuis « ${branch || "une tête détachée"} ».`);
    return 1;
  }
  const title = options.title ?? firstSubject(root);
  if (!title || !isConventionalSubject(title)) {
    printError(
      `GIT-003 : le titre n'est pas un Conventional Commit. Reçu : « ${title ?? ""} ». Passe --title "<type>(<scope>): <sujet>".`,
    );
    return 1;
  }
  const pushed = runProgram("git", ["push", "-u", "origin", branch], root);
  if (pushed !== 0) return pushed;
  const args = ["pr", "create", "--base", BASE, "--head", branch];
  const body = bodyArgs(invocation, branch);
  return runProgram("gh", [...args, "--title", title, ...body], root);
}

/**
 * Le corps vient du fichier donné, sinon des commits. `gh` tourne à la racine :
 * un chemin relatif se résout d'où `tsp` a été tapé. Une branche qui sert une
 * issue la nomme en dernière ligne.
 */
function bodyArgs(invocation: Invocation, branch: string): string[] {
  const { root, cwd, options } = invocation;
  const file = options.bodyFile && path.resolve(cwd, options.bodyFile);
  const issue = issueOfBranch(branch);
  if (issue === undefined) return file ? ["--body-file", file] : ["--fill"];
  const text = file ? fs.readFileSync(file, "utf8").trim() : commitsBody(root);
  return ["--body", [text, `Closes #${issue}`].filter(Boolean).join("\n\n")];
}

/** Ce que `gh --fill` écrirait : le corps d'un commit seul, sinon la liste des sujets. */
function commitsBody(root: string): string {
  const range = `${stagingRef(root)}..HEAD`;
  const subjects = git(root, ["log", "--reverse", "--format=%s", range]);
  if (subjects.split("\n").length === 1) {
    return git(root, ["log", "-1", "--format=%b"]);
  }
  return subjects.replace(/^/gm, "- ");
}

/** Le sujet du premier commit que la branche ajoute à `staging`. */
function firstSubject(root: string): string | undefined {
  const range = `${stagingRef(root)}..HEAD`;
  const subjects = git(root, ["log", "--reverse", "--format=%s", range]);
  return subjects.split("\n")[0] || undefined;
}

function showStatus(invocation: Invocation): number {
  const fields =
    "number,title,state,url,headRefName,baseRefName,reviewDecision,statusCheckRollup";
  const result = captureProgram(
    "gh",
    ["pr", "view", "--json", fields],
    invocation.root,
  );
  if (result.code !== 0) {
    printError(
      `${result.stderr || "gh ne répond pas."}\nPour ouvrir la PR : tsp pr`,
    );
    return 1;
  }
  emit(invocation.options.json, JSON.parse(result.stdout) as Status, render);
  return 0;
}

function render(status: Status): string {
  const head = [
    `#${status.number} ${status.title}`,
    `${status.headRefName} → ${status.baseRefName}, ${status.state}`,
    `revue : ${status.reviewDecision || "aucune"}`,
    status.url,
  ].join("\n");
  const checks = status.statusCheckRollup.map((check) => [
    check.name ?? check.context ?? "?",
    (check.conclusion || check.status || check.state || "?").toLowerCase(),
  ]);
  return `${head}\n\n${section("CI", columns(checks))}`;
}
