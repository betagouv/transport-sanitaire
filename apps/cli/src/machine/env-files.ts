// Les `.env` du dépôt face à leurs gabarits : trouver ceux qui manquent.

import fs from "node:fs";
import path from "node:path";
import { scopes } from "../apps/apps.ts";

/** Les `.env` absents alors que leur `.env.example` existe, relatifs à la racine. */
export function missingEnvFiles(root: string): string[] {
  return scopes(root)
    .map((scope) => path.join(scope.dir, ".env"))
    .filter((file) => fs.existsSync(path.join(root, `${file}.example`)))
    .filter((file) => !fs.existsSync(path.join(root, file)));
}
