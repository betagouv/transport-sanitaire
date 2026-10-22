// Écrit les règles de chaque modèle en JSON, à côté du YAML que l'éditeur livre :
// `rules/regles.publicodes` donne `rules/regles.json`. Le navigateur et Node
// importent ce JSON tel quel. Aucun analyseur YAML ne part dans le bundle, et
// le métier se charge hors de Vite.
//
// Le JSON est versionné : le typecheck, les tests et le serveur le trouvent
// sans étape préalable. Un test vérifie qu'il dit les mêmes règles que le YAML
// (`tests/model/regles-a-jour.test.ts`). À relancer après chaque livraison :
//
//   pnpm regles

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for (const yaml of reglesLivrees()) {
  const json = yaml.replace(/\.publicodes$/, ".json");
  const regles = parse(readFileSync(join(racine, yaml), "utf-8"));
  writeFileSync(join(racine, json), `${JSON.stringify(regles, null, 2)}\n`);
  console.log(`${yaml} → ${json}`);
}

// ---- implémentation ----

/** Les fichiers `.publicodes` de chaque modèle, relatifs à la racine de l'app. */
function reglesLivrees(): string[] {
  const modeles = "front/models";
  return readdirSync(join(racine, modeles)).flatMap((modele) => {
    const dossier = `${modeles}/${modele}/rules`;
    if (!existsSync(join(racine, dossier))) return [];
    return readdirSync(join(racine, dossier))
      .filter((fichier) => fichier.endsWith(".publicodes"))
      .map((fichier) => `${dossier}/${fichier}`);
  });
}
