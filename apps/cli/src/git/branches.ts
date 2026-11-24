// Les branches du dépôt : en tirer une de `staging`.

import type { Invocation } from "../core/invocation.ts";
import { printError } from "../core/output.ts";
import { runProgram } from "../core/run-program.ts";
import { COMMIT_TYPES } from "./conventional-commits.ts";

/** `tsp branch <type>/<sujet>` */
export function branchCommand(invocation: Invocation): number {
  const { root, args } = invocation;
  const [name] = args;
  const refusal = refuseName(name);
  if (refusal !== undefined) {
    printError(refusal);
    return 1;
  }
  const fetched = runProgram("git", ["fetch", "origin", "staging"], root);
  if (fetched !== 0) return fetched;
  const from = ["switch", "--create", name!, "--no-track", "origin/staging"];
  return runProgram("git", from, root);
}

// ---- implémentation ----

const BRANCH_NAME = /^[a-z]+\/[a-z0-9][a-z0-9.-]*$/;

function refuseName(name: string | undefined): string | undefined {
  if (!name || !BRANCH_NAME.test(name)) {
    return "Usage : tsp branch <type>/<sujet>, ex. fix/libelle-article-80.";
  }
  const type = name.split("/")[0]!;
  if (COMMIT_TYPES.includes(type)) return undefined;
  return `Type inconnu : « ${type} ». Types permis : ${COMMIT_TYPES.join(", ")}.`;
}
