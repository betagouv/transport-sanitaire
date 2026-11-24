// Le rôle d'un fichier se lit à son suffixe (QUAL-018), rendu exécutable. Comme
// dans `architecture.test.ts`, chaque règle donne son pourquoi dans son message
// d'échec.

import { existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { astDe, racine, sources } from "./inspection-des-sources";

// Ce qui suit déjà la règle. Un dossier s'ajoute ici quand il y est passé.
const GARDES = [
  "core/socle",
  "server/grist",
  "server/journal",
  "server/postgres",
  "front/socle/analytics",
  "front/socle/server-api",
];

// Les fichiers qui assemblent des classes ne portent pas un rôle : ils les
// branchent, comme un `index.ts` les réexporte.
const ASSEMBLAGES = ["front/socle/analytics/use-cases-in-the-tree.ts"];

const ROLES = [
  "entity",
  "vo",
  "service",
  "usecase",
  "port",
  "adapter",
  "error",
  "factory",
  "types",
  "controller",
  "hook",
  "client",
];
const ROLE = new RegExp(`\\.(${ROLES.join("|")})\\.ts$`);

describe("un fichier dit son rôle par son suffixe", () => {
  it("chaque fichier porte un suffixe de rôle", () => {
    const fautifs = sources(...GARDES).filter(
      (f) =>
        basename(f) !== "index.ts" && !ASSEMBLAGES.includes(f) && !ROLE.test(f),
    );
    expect(
      fautifs,
      "Un fichier dit son rôle par son suffixe (QUAL-018) : " +
        `${ROLES.map((role) => `\`.${role}.ts\``).join(", ")}. Seul un ` +
        "`index.ts` s'en passe. Un fichier sans rôle en mélange plusieurs : " +
        "range chaque morceau dans le fichier du rôle qu'il tient.",
    ).toEqual([]);
  });

  it("un fichier de types n'exporte que des types", () => {
    const fautifs = sources(...GARDES)
      .filter((f) => f.endsWith(".types.ts"))
      .filter((f) => astDe(f).statements.some(exporteUneValeur));
    expect(
      fautifs,
      "Un `.types.ts` n'exporte que des types (QUAL-018) : il disparaît à la " +
        "compilation, et s'importe sans rien charger. Une fonction ou une " +
        "constante va dans la classe de la notion qu'elle sert.",
    ).toEqual([]);
  });

  it("une fabrique vit à côté de ce qu'elle fabrique", () => {
    const fautifs = sources(...GARDES)
      .filter((f) => f.endsWith(".factory.ts"))
      .filter((f) => !aCoteDeSonProduit(f));
    expect(
      fautifs,
      "Une fabrique porte le nom de ce qu'elle fabrique, et vit dans son " +
        "dossier (QUAL-018) : `question.factory.ts` à côté de " +
        "`question.vo.ts`. Qui cherche comment naît une notion regarde à côté " +
        "d'elle.",
    ).toEqual([]);
  });
});

// ---- implémentation ----

function exporteUneValeur(instruction: ts.Statement): boolean {
  if (ts.isExportDeclaration(instruction)) return !instruction.isTypeOnly;
  if (ts.isExportAssignment(instruction)) return true;
  const exportee =
    ts.canHaveModifiers(instruction) &&
    ts
      .getModifiers(instruction)
      ?.some(({ kind }) => kind === ts.SyntaxKind.ExportKeyword);
  return (
    Boolean(exportee) &&
    !ts.isTypeAliasDeclaration(instruction) &&
    !ts.isInterfaceDeclaration(instruction)
  );
}

function aCoteDeSonProduit(fabrique: string): boolean {
  const produit = basename(fabrique, ".factory.ts");
  return ["vo", "entity"].some((role) =>
    existsSync(join(racine, dirname(fabrique), `${produit}.${role}.ts`)),
  );
}
