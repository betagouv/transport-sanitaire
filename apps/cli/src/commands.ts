// Les commandes de tsp : trouver celle qu'on tape, et l'aide qui les liste.

import type { Command } from "./core/invocation.ts";
import { columns, section } from "./core/output.ts";
import { branchCommand } from "./git/branches.ts";
import { prCommand } from "./git/pull-requests.ts";
import { doctorCommand } from "./machine/doctor.ts";
import { setupCommand } from "./machine/setup.ts";
import { openCommand } from "./machine/tools.ts";

export function findCommand(name: string): Command | undefined {
  return COMMANDS.find((entry) => entry.name === name)?.run;
}

/** Pour une commande retirée, ce qui la remplace. */
export function replacementOf(name: string): string | undefined {
  if (LAUNCHERS.includes(name)) return `pnpm --filter <app> ${name}`;
  if (READERS.includes(name)) return "lis directement les fichiers du dépôt";
  if (TRACKING.includes(name)) return "le suivi se tient dans Notion";
  return undefined;
}

export function helpText(): string {
  return [
    "tsp, le point d'entrée du dépôt transports sanitaires.",
    section("Commandes", usages()),
    section("Options", columns(OPTIONS)),
    "Le reste passe par pnpm : pnpm --filter <app> <script>.",
  ].join("\n\n");
}

// ---- implémentation ----

type Entry = { name: string; usage: string; summary: string; run: Command };

const COMMANDS: Entry[] = [
  {
    name: "setup",
    usage: "setup",
    summary: "prépare la machine : mise, toolchain, dépendances, hooks, .env",
    run: setupCommand,
  },
  {
    name: "doctor",
    usage: "doctor",
    summary: "dit ce qui manque, et la commande qui le répare",
    run: doctorCommand,
  },
  {
    name: "open",
    usage: "open [outil …]",
    summary: "liste les outils du projet, ou en ouvre dans le navigateur",
    run: openCommand,
  },
  {
    name: "branch",
    usage: "branch <type>/<sujet>",
    summary: "tire une branche de staging",
    run: branchCommand,
  },
  {
    name: "pr",
    usage: "pr",
    summary: "pousse la branche et ouvre la PR vers staging",
    run: prCommand,
  },
];

const LAUNCHERS = ["install", "build", "start", "test", "dev", "verifier"];
const READERS = ["features", "apps", "rules", "skills", "docs"];
const TRACKING = ["issue", "wip", "next"];

const OPTIONS = [
  ["--json", "sortie JSON, pour doctor et open"],
  ["--yes", "répond oui aux confirmations, pour setup"],
  ["--title <titre>", "le titre de la PR, pour pr"],
  ["--body-file <fichier>", "le corps de la PR, pour pr"],
];

function usages(): string {
  return columns(
    COMMANDS.map((entry) => [`tsp ${entry.usage}`, entry.summary]),
  );
}
