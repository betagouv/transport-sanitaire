// Les apps du dépôt, pour ce que `setup` et `doctor` en lisent.

import fs from "node:fs";
import path from "node:path";

/** Le dossier d'une app, relatif à la racine. */
export type App = { dir: string };

export function listApps(root: string): App[] {
  return fs
    .readdirSync(path.join(root, "apps"))
    .sort()
    .map((name) => path.join("apps", name))
    .filter((dir) => fs.existsSync(path.join(root, dir, "package.json")))
    .map((dir) => ({ dir }));
}
