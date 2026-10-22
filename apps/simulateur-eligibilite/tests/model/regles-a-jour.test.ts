// Les règles qu'importe le code (`rules/regles.json`) sont celles que l'éditeur
// a livrées (`rules/regles.publicodes`). Le JSON est écrit par
// `scripts/regles-publicodes.ts` : un YAML recopié sans relancer le script
// laisserait le simulateur décider avec l'ancienne version.

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { racine, texteDe } from "../inspection-des-sources";

describe("les règles de chaque modèle", () => {
  it.each(reglesLivrees())("%s est à jour en JSON", (yaml) => {
    const json = yaml.replace(/\.publicodes$/, ".json");
    expect(
      JSON.parse(texteDe(json)),
      `\`${json}\` ne dit pas les mêmes règles que \`${yaml}\`. Relance ` +
        "`pnpm regles` après chaque livraison de l'éditeur.",
    ).toEqual(parse(texteDe(yaml)));
  });
});

// ---- implémentation ----

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
