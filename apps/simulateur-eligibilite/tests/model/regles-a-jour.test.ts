// Les règles qu'importe le code (`rules/regles.json`) sont celles que l'éditeur
// a livrées (`rules/regles.publicodes`). Le JSON est écrit par
// `scripts/regles-publicodes.ts` : un YAML recopié sans relancer le script
// laisserait le simulateur décider avec l'ancienne version.
//
// Le script écrit aussi leur graphe (`rules/regles.graphe.json`, #196). Il
// doit valoir ce que publicodes calcule : on les compare sur des situations
// tirées au sort, toujours les mêmes.

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { Fait } from "../../core/socle";
import {
  DecisionGraph,
  type FaitValue,
} from "../../core/socle/decision-engine/decision-graph";
import {
  decisionGraphOf,
  publicodesEngine,
} from "../../core/socle/decision-engine/publicodes";
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

describe("le graphe de chaque modèle", () => {
  it.each(reglesLivrees())("celui de %s est à jour", (yaml) => {
    const graphe = yaml.replace(/\.publicodes$/, ".graphe.json");
    expect(
      JSON.parse(texteDe(graphe)),
      `\`${graphe}\` n'est pas le graphe de \`${yaml}\`. Relance \`pnpm regles\`.`,
    ).toEqual(decisionGraphOf(parse(texteDe(yaml))));
  });

  it.each(reglesLivrees())(
    "celui de %s vaut ce que publicodes calcule",
    (yaml) => {
      const graphe = yaml.replace(/\.publicodes$/, ".graphe.json");
      const data = JSON.parse(texteDe(graphe));
      const regles = Object.keys(data.rules);
      const moteur = publicodesEngine(parse(texteDe(yaml)), regles);
      const decision = new DecisionGraph(data);
      for (const situation of situationsTirees(data.faits)) {
        const attendu = moteur.cibles(faitsDe(situation));
        for (const regle of regles) {
          expect(
            decision.valueOf(regle, situation),
            `${regle} pour ${JSON.stringify(situation)}`,
          ).toEqual(attendu[regle]?.value);
        }
      }
    },
    // Publicodes recalcule toutes les règles de chaque situation.
    30_000,
  );
});

// ---- implémentation ----

const SITUATIONS = 300;

// Des situations tirées au sort, toujours les mêmes : chaque fait vaut oui ou
// non, ou reste absent, plus ou moins souvent d'une situation à l'autre.
function situationsTirees(faits: readonly string[]) {
  const hasard = suiteFixe(196);
  return Array.from({ length: SITUATIONS }, (_, index) => {
    const absent = [0, 0.1, 0.3, 0.6][index % 4] ?? 0;
    return Object.fromEntries(
      faits.flatMap((fait): [string, FaitValue][] =>
        hasard() < absent ? [] : [[fait, hasard() < 0.5]],
      ),
    );
  });
}

// Un générateur pseudo-aléatoire à graine (mulberry32).
function suiteFixe(graine: number): () => number {
  let etat = graine;
  return () => {
    etat = (etat + 0x6d2b79f5) | 0;
    let t = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function faitsDe(situation: Readonly<Record<string, FaitValue>>) {
  return Object.fromEntries(
    Object.entries(situation).map(([fait, value]) => [
      fait,
      value ? Fait.oui("tiré au sort") : Fait.non("tiré au sort"),
    ]),
  );
}

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
