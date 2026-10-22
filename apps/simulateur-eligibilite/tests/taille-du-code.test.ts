// Les limites de taille du code, rendues exécutables (QUAL-005, QUAL-010).
//
// Elles détectent un problème, elles ne disent pas où couper. Comme dans
// `architecture.test.ts`, chaque règle donne son pourquoi dans son message
// d'échec.

import { describe, expect, it } from "vitest";
import { fonctionsDe, lignesDe, sources } from "./inspection-des-sources";

// Le catalogue de seeds d'un modèle : une liste de données.
const CATALOGUE_DE_SEEDS = /^front\/models\/[^/]+\/seeds-catalogue\.ts$/;

describe("taille du code", () => {
  it("aucune fonction ne dépasse 30 lignes", () => {
    const trop = sources(
      "front",
      "core",
      "server",
      "shared",
      "scripts",
    ).flatMap((fichier) =>
      fonctionsDe(fichier)
        .filter(({ lignes }) => lignes > 30)
        .map(({ ligne, lignes }) => `${fichier}:${ligne} (${lignes} lignes)`),
    );
    expect(
      trop,
      "Une fonction qu'on ne voit pas d'un écran fait plusieurs choses. La " +
        "limite *détecte* le problème, elle ne dit pas où couper : cherche la " +
        "jointure de sens (le plus souvent, un branchement sur des cas " +
        "métier), pas le fragment le moins cher à sortir. Les fichiers de " +
        "test sont exemptés : un bloc de cas n'est pas un traitement.",
    ).toEqual([]);
  });

  it("aucun fichier ne dépasse 300 lignes", () => {
    const trop = sources(
      "front",
      "core",
      "server",
      "shared",
      "scripts",
      "tests",
    )
      .filter((fichier) => !CATALOGUE_DE_SEEDS.test(fichier))
      .map((fichier) => ({ fichier, lignes: lignesDe(fichier) }))
      .filter(({ lignes }) => lignes > 300)
      .map(({ fichier, lignes }) => `${fichier} (${lignes} lignes)`);
    expect(
      trop,
      "Passé cette taille, un fichier porte plusieurs intentions : sépare-le " +
        "par sujet, jamais en déplaçant le débordement ailleurs. Seule " +
        "exception : le catalogue de seeds, qui est une liste de données et " +
        "vaut d'être lu d'un seul tenant.",
    ).toEqual([]);
  });
});
