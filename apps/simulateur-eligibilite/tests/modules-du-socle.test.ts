// Les modules du socle et leur index, rendus exécutables.
//
// Un module du socle est un dossier direct de `core/socle/` ou `front/socle/`.
// Son `index.ts` dit ce qu'il promet au reste du socle (ADR-28). Ce fichier
// vérifie que chaque module en a un, et que personne ne le contourne.

import { existsSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { describe, expect, it } from "vitest";
import { importsDe, racine, sources } from "./inspection-des-sources";

// Le socle, à l'écran et dans le métier.
const SOCLE = ["front/socle", "core/socle"];

const MODULES = SOCLE.flatMap((socle) =>
  readdirSync(join(racine, socle), { withFileTypes: true })
    .filter((entree) => entree.isDirectory())
    .map((entree) => `${socle}/${entree.name}`),
);

// Les portes à part d'un module, importables sans passer par son index, avec
// leur pourquoi.
const PORTES = [
  // Importe publicodes, qui ne doit entrer que dans le chunk d'un modèle.
  "core/socle/decision-engine/publicodes-decision-engine.adapter",
  // Importe publicodes, pour l'outil des règles et les tests seulement.
  "core/socle/decision-engine/publicodes-graph-compiler.adapter",
];

const moduleDe = (fichier: string) =>
  MODULES.find(
    (module) => fichier === module || fichier.startsWith(`${module}/`),
  ) ?? null;
const sansExtension = (cible: string) => cible.replace(/\.tsx?$/, "");
// Une feuille de style, un gabarit : pas du code du module.
const unAutreFichier = (cible: string) => /\.(?!tsx?$)\w+$/.test(cible);

// Les tests d'un module lisent ses fichiers en direct.
const testsDu = (module: string) => `tests/socle/${basename(module)}/`;

describe("les modules du socle", () => {
  it("chaque module a son index", () => {
    expect(
      MODULES.filter(
        (module) => !existsSync(join(racine, `${module}/index.ts`)),
      ),
      "Un module du socle est un dossier direct de `core/socle/` ou " +
        "`front/socle/`. Son `index.ts` est son contrat : ce qu'il promet au " +
        "reste du socle, et rien d'autre. Sans lui, il faut lire tout le " +
        "dossier pour savoir ce qui s'y lit de l'extérieur.",
    ).toEqual([]);
  });

  it("hors d'un module, on n'importe que son index", () => {
    const profonds = sources("core", "front", "server", "tests").flatMap(
      (fichier) =>
        importsDe(fichier)
          .filter((cible) => contourneUnIndex(fichier, cible))
          .map((cible) => `${fichier} → ${cible}`),
    );
    expect(
      profonds,
      "L'index d'un module dit ce qu'il promet. Un import plus profond lie " +
        "l'importeur à un détail du module, qui ne peut plus changer sans le " +
        "casser, et personne ne voit que ce détail est lu de l'extérieur. " +
        "S'il manque quelque chose, ajoute-le à l'index. Seuls les tests du " +
        "module (`tests/socle/<module>/`) lisent ses fichiers en direct.",
    ).toEqual([]);
  });
});

function contourneUnIndex(fichier: string, cible: string): boolean {
  const module = moduleDe(cible);
  if (!module || moduleDe(fichier) === module) return false;
  if (fichier.startsWith(testsDu(module)) || unAutreFichier(cible))
    return false;
  const sans = sansExtension(cible);
  return (
    sans !== module && sans !== `${module}/index` && !PORTES.includes(sans)
  );
}
