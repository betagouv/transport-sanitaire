// Les fichiers jamais versionnés que la machine doit avoir, face à leurs
// gabarits : les `.env`, et la liste des outils de `tsp open`.

import fs from "node:fs";
import path from "node:path";
import { scopes } from "../apps/apps.ts";

/** Un fichier local et le gabarit versionné dont il se copie, relatifs à la racine. */
export type LocalFile = { file: string; template: string };

/** La liste des outils : privée, parce qu'elle nomme l'infrastructure du projet. */
export const TOOLS_FILE = "apps/cli/tools.json";

/** Les fichiers locaux absents alors que leur gabarit existe. */
export function missingLocalFiles(root: string): LocalFile[] {
  const envFiles = scopes(root).map((scope) => {
    const file = path.join(scope.dir, ".env");
    return { file, template: `${file}.example` };
  });
  const tools = { file: TOOLS_FILE, template: "apps/cli/tools.example.json" };
  return [...envFiles, tools]
    .filter((each) => fs.existsSync(path.join(root, each.template)))
    .filter((each) => !fs.existsSync(path.join(root, each.file)));
}
