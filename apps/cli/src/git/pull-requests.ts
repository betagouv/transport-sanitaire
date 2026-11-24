// Les PR du dépôt : ouvrir une PR vers `staging`.

import path from "node:path";
import type { Invocation } from "../core/invocation.ts";
import { printError } from "../core/output.ts";
import { runProgram } from "../core/run-program.ts";
import { isConventionalSubject } from "./conventional-commits.ts";
import { git, stagingRef } from "./git.ts";

/** `tsp pr` */
export function prCommand(invocation: Invocation): number {
  const { root, cwd, args, options } = invocation;
  if (args.length > 0) {
    printError(`Usage : tsp pr. L'état d'une PR se lit par gh pr view.`);
    return 1;
  }
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
  // `gh` tourne à la racine : un chemin relatif se résout d'où `tsp` a été tapé.
  const body = options.bodyFile
    ? ["--body-file", path.resolve(cwd, options.bodyFile)]
    : ["--fill"];
  const create = ["pr", "create", "--base", BASE, "--head", branch];
  return runProgram("gh", [...create, "--title", title, ...body], root);
}

// ---- implémentation ----

/** La seule cible permise : c'est ce qui applique GIT-009 côté PR. */
const BASE = "staging";

/** Le sujet du premier commit que la branche ajoute à `staging`. */
function firstSubject(root: string): string | undefined {
  const range = `${stagingRef(root)}..HEAD`;
  const subjects = git(root, ["log", "--reverse", "--format=%s", range]);
  return subjects.split("\n")[0] || undefined;
}
