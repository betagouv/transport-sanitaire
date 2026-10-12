// Préparer la machine, une fois Node disponible : dépendances, hooks, `.env`,
// lien vers le lanceur, puis le diagnostic. `mise` et le toolchain sont posés
// avant, en shell, par `bin/amorce.sh`.

import fs from "node:fs";
import path from "node:path";
import type { Invocation } from "../core/invocation.ts";
import { print } from "../core/output.ts";
import { runProgram } from "../core/run-program.ts";
import { doctorCommand } from "./doctor.ts";
import { missingEnvFiles } from "./env-files.ts";
import { isOnPath, linkLauncher, linkPath } from "./launcher-link.ts";

/** `tsp setup`. Rejouable : chaque étape ne fait que ce qui manque. */
export function setupCommand(invocation: Invocation): number {
  const { root } = invocation;
  for (const step of [installDependencies, plugHooks]) {
    const code = step(root);
    if (code !== 0) return code;
  }
  createEnvFiles(root);
  link(root);
  print("");
  return doctorCommand(invocation);
}

// ---- implémentation ----

function installDependencies(root: string): number {
  print("Dépendances : pnpm install");
  return runProgram("pnpm", ["install"], root);
}

/** Le `prepare` de la racine le fait déjà. Le redire ici le rend visible. */
function plugHooks(root: string): number {
  print("Hooks git : core.hooksPath = .githooks");
  return runProgram("git", ["config", "core.hooksPath", ".githooks"], root);
}

function createEnvFiles(root: string): void {
  for (const file of missingEnvFiles(root)) {
    fs.copyFileSync(path.join(root, `${file}.example`), path.join(root, file));
    print(`.env : ${file} créé depuis son gabarit, à compléter`);
  }
}

function link(root: string): void {
  const target = linkLauncher(root);
  if (!target) {
    print(`Lien : ${linkPath()} est un fichier, laissé en place`);
    return;
  }
  print(`Lien : ${linkPath()} → ${target}`);
  if (!isOnPath()) {
    print(`Lien : ajoute ${path.dirname(linkPath())} à ton PATH`);
  }
}
