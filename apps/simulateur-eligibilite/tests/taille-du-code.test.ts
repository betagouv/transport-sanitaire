// Les limites de taille du code, rendues exécutables (QUAL-005, QUAL-010).
//
// Elles détectent un problème, elles ne disent pas où couper. Comme dans
// `architecture.test.ts`, chaque règle donne son pourquoi dans son message
// d'échec.

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  fonctionsDe,
  lignesDe,
  racine,
  sources,
} from "./inspection-des-sources";

// Le catalogue de seeds d'un modèle : une liste de données.
const CATALOGUE_DE_SEEDS = /^core\/models\/[^/]+\/seeds-catalogue\.ts$/;

// Les fichiers d'un seul sujet qui dépassent quand même 300 lignes : chacun a
// son plafond, et la raison pour laquelle le couper serait artificiel.
const PLAFONDS: Readonly<Record<string, { lignes: number; raison: string }>> = {
  "core/socle/questionnaire-engine/question/declared/question.vo.ts": {
    lignes: 311,
    raison:
      "ses réglages sont son interface ; l'incohérence en est déjà sortie",
  },
};

describe("taille du code", () => {
  it("aucune fonction ne dépasse 30 lignes", () => {
    const trop = sources(
      "front",
      "core",
      "server",
      "shared",
      "tooling",
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
      "tooling",
      "tests",
    )
      .filter((fichier) => !CATALOGUE_DE_SEEDS.test(fichier))
      .map((fichier) => ({ fichier, lignes: lignesDe(fichier) }))
      .filter(({ fichier, lignes }) => lignes > plafondDe(fichier))
      .map(({ fichier, lignes }) => `${fichier} (${lignes} lignes)`);
    expect(
      trop,
      "Passé cette taille, un fichier porte plusieurs intentions : sépare-le " +
        "par sujet, jamais en déplaçant le débordement ailleurs. Le catalogue " +
        "de seeds y échappe : c'est une liste de données, à lire d'un seul " +
        "tenant. Un fichier d'un seul sujet peut prendre un plafond dans " +
        "`PLAFONDS`, avec sa raison, une fois ses sujets cherchés (QUAL-010).",
    ).toEqual([]);
  });

  it("chaque plafond sert encore", () => {
    const inutiles = Object.keys(PLAFONDS).filter(
      (fichier) =>
        !existsSync(join(racine, fichier)) || lignesDe(fichier) <= 300,
    );
    expect(
      inutiles,
      "Ce fichier tient de nouveau sous 300 lignes, ou n'existe plus : retire " +
        "son plafond, pour que la limite commune vaille de nouveau.",
    ).toEqual([]);
  });
});

function plafondDe(fichier: string): number {
  return PLAFONDS[fichier]?.lignes ?? 300;
}
