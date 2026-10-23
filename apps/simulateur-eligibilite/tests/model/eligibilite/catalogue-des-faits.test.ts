// Le catalogue des faits : un fichier par fait sous `faits/`, qui porte son
// nom sans `fait_`. On y lit tout ce que vaut un fait, sans chercher ailleurs.

import { basename } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { FAITS } from "../../../core/models/eligibilite/declarations/faits";
import { astDe, sources, texteDe } from "../../inspection-des-sources";

const DOSSIER = "core/models/eligibilite/faits";
const INDEX = `${DOSSIER}/index.ts`;

const sansPrefixe = (fait: string) => fait.replace(/^fait_/, "");
const fichierDe = (fait: string) =>
  `${DOSSIER}/${sansPrefixe(fait).replaceAll("_", "-")}.ts`;
const declarationDe = (fait: string) =>
  sansPrefixe(fait).replace(/_(.)/g, (_, initiale: string) =>
    initiale.toUpperCase(),
  );

describe("le catalogue des faits", () => {
  it("à chaque fait répond un fichier, et à chaque fichier un fait", () => {
    expect(
      sources(DOSSIER)
        .filter((fichier) => fichier !== INDEX)
        .sort(),
      "Un fait se trouve par son nom : `fait_distance_plus_50` vit dans " +
        "`faits/distance-plus-50.ts`. Un fichier sans fait n'a pas sa place " +
        "ici : ce que plusieurs faits lisent est un concept, sous `concepts/`.",
    ).toEqual(FAITS.map(fichierDe).sort());
  });

  it.each(FAITS)("%s n'exporte que sa déclaration", (fait) => {
    expect(
      exportsDe(fichierDe(fait)),
      "Le fichier d'un fait n'exporte que sa déclaration, au nom du fait en " +
        "camelCase. Ce qu'il est seul à lire reste privé, sous le marqueur " +
        "d'implémentation. Ce que d'autres lisent devient un concept.",
    ).toEqual([declarationDe(fait)]);
  });

  it.each(FAITS)("%s s'ouvre sur le titre de l'éditeur", (fait) => {
    const texte = texteDe(fichierDe(fait));
    expect(
      [
        texte.startsWith(`// ${fait} : `),
        /Il suit `[A-Z_]+\.(json|md)`/.test(texte),
      ],
      `${basename(fichierDe(fait))} s'ouvre sur « // ${fait} : », suivi du ` +
        "titre que l'éditeur donne au fait, et dit le contrat qu'il suit : " +
        "`CONTRAT_REPONSES_FAITS.json`, ou le correctif qui le reprend.",
    ).toEqual([true, true]);
  });
});

// Les noms qu'un fichier exporte, dans l'ordre où il les déclare.
function exportsDe(fichier: string): string[] {
  return astDe(fichier).statements.filter(estExporte).flatMap(nomsDe);
}

function estExporte(instruction: ts.Statement): boolean {
  if (ts.isExportDeclaration(instruction)) return true;
  return (
    ts.canHaveModifiers(instruction) &&
    (ts.getModifiers(instruction) ?? []).some(
      (modificateur) => modificateur.kind === ts.SyntaxKind.ExportKeyword,
    )
  );
}

function nomsDe(instruction: ts.Statement): string[] {
  if (ts.isVariableStatement(instruction))
    return instruction.declarationList.declarations.map((declaration) =>
      declaration.name.getText(),
    );
  if (ts.isExportDeclaration(instruction))
    return [instruction.exportClause?.getText() ?? "*"];
  const nom = (instruction as { name?: ts.Identifier }).name;
  return [nom?.getText() ?? "default"];
}
