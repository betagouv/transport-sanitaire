// Écrit les règles de chaque modèle en JSON, à côté du YAML que l'éditeur livre :
// `rules/regles.publicodes` donne `rules/regles.json`. Le navigateur et Node
// importent ce JSON tel quel. Aucun analyseur YAML ne part dans le bundle, et
// le métier se charge hors de Vite.
//
// Il écrit aussi leur graphe de décision, `rules/regles.graphe.json` (#196) :
// ce que vaut chaque règle pour chaque façon dont ses faits valent oui, non ou
// rien. Un nœud par ligne, pour qu'une livraison se lise dans le diff.
//
// Les deux JSON sont versionnés : le typecheck, les tests et le serveur les
// trouvent sans étape préalable. Un test vérifie qu'ils disent les mêmes
// règles que le YAML (`tests/model/regles-a-jour.test.ts`). À relancer après
// chaque livraison :
//
//   pnpm regles

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import type { DecisionGraphData } from "../core/socle/decision-engine/decision-graph.ts";
import { decisionGraphOf } from "../core/socle/decision-engine/publicodes.ts";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for (const yaml of reglesLivrees()) {
  const json = yaml.replace(/\.publicodes$/, ".json");
  const regles = parse(readFileSync(join(racine, yaml), "utf-8"));
  writeFileSync(join(racine, json), `${JSON.stringify(regles, null, 2)}\n`);
  const graphe = yaml.replace(/\.publicodes$/, ".graphe.json");
  writeFileSync(join(racine, graphe), texteDuGraphe(decisionGraphOf(regles)));
  console.log(`${yaml} → ${json}, ${graphe}`);
}

// ---- implémentation ----

/** Le graphe en JSON : une règle, puis un nœud, par ligne. */
function texteDuGraphe({ faits, rules, nodes }: DecisionGraphData): string {
  const lignes = (valeurs: string[]) =>
    valeurs.map((v) => `    ${v}`).join(",\n");
  const regles = Object.entries(rules).map(
    ([nom, noeud]) => `${JSON.stringify(nom)}: ${noeud}`,
  );
  return [
    "{",
    `  "faits": [\n${lignes(faits.map((f) => JSON.stringify(f)))}\n  ],`,
    `  "rules": {\n${lignes(regles)}\n  },`,
    `  "nodes": [\n${lignes(nodes.map((n) => JSON.stringify(n)))}\n  ]`,
    "}",
    "",
  ].join("\n");
}

/** Les fichiers `.publicodes` de chaque modèle, relatifs à la racine de l'app. */
function reglesLivrees(): string[] {
  const modeles = "core/models";
  return readdirSync(join(racine, modeles)).flatMap((modele) => {
    const dossier = `${modeles}/${modele}/rules`;
    if (!existsSync(join(racine, dossier))) return [];
    return readdirSync(join(racine, dossier))
      .filter((fichier) => fichier.endsWith(".publicodes"))
      .map((fichier) => `${dossier}/${fichier}`);
  });
}
