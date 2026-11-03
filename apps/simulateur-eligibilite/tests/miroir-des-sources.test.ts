// Les dossiers de tests sont le miroir des sources (#292).
//
// Comme dans `tests/architecture.test.ts`, chaque règle donne son pourquoi
// dans son message d'échec.

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { racine } from "./inspection-des-sources";

// Un dossier de tests porte le nom d'un dossier de sources, et, s'il est
// imbriqué, son parent celui d'un dossier qui contient ce dossier de sources.
// Le factice n'a pas de source : c'est l'exception.
const FIXTURES = "tests/socle/fixtures";
const SOURCES_DES_TESTS: Record<string, string[]> = {
  "tests/socle": ["front/socle", "core/socle", "server", "shared"],
  "tests/model": ["core/models", "front/models"],
};

const dossiersSous = (dossier: string): string[] =>
  readdirSync(join(racine, dossier), { withFileTypes: true })
    .filter((entree) => entree.isDirectory())
    .map((entree) => `${dossier}/${entree.name}`)
    .flatMap((sous) => [sous, ...dossiersSous(sous)]);

const sourcesDe = (dossierDeTests: string): string[] => {
  const [tests, sources] =
    Object.entries(SOURCES_DES_TESTS).find(([tests]) =>
      dossierDeTests.startsWith(`${tests}/`),
    ) ?? [];
  if (!tests || !sources) return [];
  const chemin = dossierDeTests.slice(tests.length + 1).split("/");
  const nom = chemin.at(-1);
  const parent = chemin.at(-2);
  return sources
    .filter((source) => existsSync(join(racine, source)))
    .flatMap((source) => [source, ...dossiersSous(source)])
    .filter((source) => source.split("/").at(-1) === nom)
    .filter((source) => !parent || source.split("/").includes(parent));
};

describe("les dossiers de tests", () => {
  it("chaque dossier de tests a son dossier de sources", () => {
    const sansSource = Object.keys(SOURCES_DES_TESTS)
      .flatMap(dossiersSous)
      .filter((dossier) => !dossier.startsWith(FIXTURES))
      .filter((dossier) => sourcesDe(dossier).length === 0);
    expect(
      sansSource,
      "Les tests se rangent comme les sources : `tests/socle/questionnaire/` " +
        "éprouve `front/socle/questionnaire/`, `tests/model/eligibilite/r2/" +
        "acceptee/` le cas accepté de R2. Un dossier qui ne porte le nom " +
        "d'aucun dossier de sources cache ce qu'il éprouve.",
    ).toEqual([]);
  });
});
