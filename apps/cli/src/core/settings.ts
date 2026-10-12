// Les réglages de tsp : l'environnement d'abord, le `.env` de la racine
// ensuite.

import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";

/** La valeur d'un réglage, ou rien s'il est absent ou vide. */
export function setting(root: string, key: string): string | undefined {
  return process.env[key] || fromFile(root)[key] || undefined;
}

// ---- implémentation ----

function fromFile(root: string): NodeJS.Dict<string> {
  const file = path.join(root, ".env");
  return fs.existsSync(file) ? parseEnv(fs.readFileSync(file, "utf8")) : {};
}
