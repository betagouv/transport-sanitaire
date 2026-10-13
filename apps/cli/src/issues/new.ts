// Ouvrir une issue : un chantier, ou une tâche sous un chantier.

import fs from "node:fs";
import path from "node:path";
import { findApp, unknownApp } from "../apps/apps.ts";
import type { Invocation } from "../core/invocation.ts";
import { withoutFrontmatter } from "../core/markdown.ts";
import { print, printError } from "../core/output.ts";
import { createIssue, findIssue } from "../git/issues.ts";
import { withPath } from "./titles.ts";

/** `tsp issue new <type> <titre> [--app <app>] [--body-file <fichier>]` */
export function newCommand(invocation: Invocation): number {
  const { root, args, options } = invocation;
  const [type, ...words] = args;
  const title = words.join(" ");
  if (!type || title === "") {
    printError("Usage : tsp issue new <type> <titre> [--app <app>].");
    return 1;
  }
  if (!CHANTIER_TYPES.includes(type)) {
    printError(
      `Type inconnu : « ${type} ». Types permis : ${CHANTIER_TYPES.join(", ")}.`,
    );
    return 1;
  }
  const app =
    options.app === undefined ? undefined : findApp(root, options.app);
  if (options.app !== undefined && !app) {
    printError(unknownApp(root, options.app));
    return 1;
  }
  const labels = [type, ...(app ? [app.name] : [])];
  print(
    createIssue(root, { title, body: body(invocation, "chantier"), labels }),
  );
  return 0;
}

/** `tsp issue add <parent> <titre> [--blocked-by <n,…>] [--body-file <fichier>]` */
export function addCommand(invocation: Invocation): number {
  const { root, args, options } = invocation;
  const [asked, ...words] = args;
  const blockedBy = options.blockedBy?.replaceAll("#", "");
  const refusal = refuseAdd(asked, words, blockedBy);
  if (refusal !== undefined) {
    printError(refusal);
    return 1;
  }
  const parent = Number(asked!.replace("#", ""));
  const found = findIssue(root, parent);
  if (!found) {
    printError(`Aucune issue ne porte le numéro ${parent}.`);
    return 1;
  }
  const title = withPath(found.title, words.join(" "));
  const draft = { title, body: body(invocation, "tache"), blockedBy };
  print(createIssue(root, { ...draft, parent }));
  return 0;
}

// ---- implémentation ----

/** Les types d'un chantier, posés en étiquette. */
const CHANTIER_TYPES = [
  "feat",
  "fix",
  "refactor",
  "tech",
  "chore",
  "docs",
  "test",
];

const NUMBER = /^#?\d+$/;
const NUMBERS = /^\d+(,\d+)*$/;

function refuseAdd(
  parent: string | undefined,
  words: string[],
  blockedBy: string | undefined,
): string | undefined {
  if (!parent || !NUMBER.test(parent) || words.length === 0) {
    return "Usage : tsp issue add <parent> <titre> [--blocked-by <n,…>].";
  }
  if (blockedBy === undefined || NUMBERS.test(blockedBy)) return undefined;
  return `--blocked-by attend des numéros séparés par des virgules. Reçu : « ${blockedBy} ».`;
}

/** Le fichier donné, sinon le gabarit du dépôt, sans l'en-tête que GitHub lui demande. */
function body(invocation: Invocation, template: string): string {
  const { root, cwd, options } = invocation;
  const file = options.bodyFile
    ? path.resolve(cwd, options.bodyFile)
    : path.join(root, ".github/ISSUE_TEMPLATE", `${template}.md`);
  if (!fs.existsSync(file)) return "";
  return withoutFrontmatter(fs.readFileSync(file, "utf8")).trim();
}
