// Ce qu'une commande reçoit : le dépôt, ses arguments et ses options.

import path from "node:path";
import { parseArgs } from "node:util";

type Options = {
  /** Sortie JSON, pour un agent. */
  json: boolean;
  /** Répond oui à toute confirmation. */
  yes: boolean;
  help: boolean;
  title?: string;
  bodyFile?: string;
};

export type Invocation = {
  /** La racine du clone dont la CLI s'exécute. */
  root: string;
  /** Le dossier d'où `tsp` a été tapé : un chemin relatif s'y résout. */
  cwd: string;
  /** Les arguments positionnels, après le nom de la commande. */
  args: string[];
  options: Options;
};

export type Command = (invocation: Invocation) => number | Promise<number>;

/** Lit la ligne de commande. Lève une erreur sur une option inconnue. */
export function readInvocation(argv: string[]): {
  name: string | undefined;
  invocation: Invocation;
} {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: FLAGS,
  });
  const [name, ...args] = positionals;
  return {
    name,
    invocation: {
      root: path.resolve(import.meta.dirname, "../../../.."),
      // Le lanceur exécute la CLI depuis la racine : il transmet le dossier
      // d'origine par l'environnement.
      cwd: process.env.TSP_CWD ?? process.cwd(),
      args,
      options: {
        json: values.json,
        yes: values.yes,
        help: values.help,
        title: values.title,
        bodyFile: values["body-file"],
      },
    },
  };
}

// ---- implémentation ----

const FLAGS = {
  json: { type: "boolean", default: false },
  yes: { type: "boolean", short: "y", default: false },
  help: { type: "boolean", short: "h", default: false },
  title: { type: "string" },
  "body-file": { type: "string" },
} as const;
