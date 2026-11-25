// Le rôle d'un fichier se lit à son suffixe (QUAL-018), rendu exécutable. Comme
// dans `architecture.test.ts`, chaque règle donne son pourquoi dans son message
// d'échec.

import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { exportsQuiNeSontPasDesConditions } from "./inspection-des-conditions";
import { astDe, racine, sources } from "./inspection-des-sources";

// Ce qui suit la règle dans chaque modèle de `core/models/`, quand il l'a : les
// rubriques de son cerfa, et ses questions. Le reste du modèle y passera à son
// tour.
const DOSSIERS_DES_MODELES = ["r3/rubriques", "questions"];

// Ce que `questions/` garde encore sans suffixe : des fichiers qui ne sont ni une
// question ni une condition, et que le chantier n'a pas traités. Chacun se
// nomme ici, un par un : un nouveau fichier sans rôle n'y entre pas par
// mégarde.
const SANS_SUFFIXE_POUR_L_INSTANT = [
  // le contrat que toutes les questions d'un modèle bâtissent, et les réponses
  // qu'il en tire
  /^core\/models\/[^/]+\/questions\/(question|reponses)\.ts$/,
  // trois fichiers de P3 qui bâtissent des questions de lieu sans en être une
  "core/models/eligibilite/questions/p3/questions/champs-du-lieu.ts",
  "core/models/eligibilite/questions/p3/questions/cotes-du-lieu.ts",
  "core/models/eligibilite/questions/p3/questions/lieu.ts",
  // les deux lectures de l'indication, que R2 et la partie 2 lisent aussi
  "core/models/eligibilite/questions/p2/questions/q2-2-1-indication.ts",
];

// Ce qui suit déjà la règle. Un dossier s'ajoute ici quand il y est passé.
const GARDES = [
  "core/socle",
  "server/grist",
  "server/journal",
  "server/postgres",
  "front/socle/analytics",
  "front/socle/cerfa",
  "front/socle/server-api",
  ...dossiersGardesDesModeles(),
];

// Un composant React (`.tsx`) n'a pas de suffixe de rôle : QUAL-018 ne vaut pas
// pour lui.
const estUnComposant = (fichier: string) => fichier.endsWith(".tsx");

// Un fichier qui assemble les classes d'une racine ne porte pas un rôle : il les
// branche, comme un `index.ts` les réexporte.
const ASSEMBLEURS = ["index.ts", "container.ts"];

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
  "constants",
  "schema",
  "controller",
  "middleware",
  "hook",
  "client",
  "fait",
  "question",
  "condition",
  "rubrique",
];
const ROLE = new RegExp(`\\.(${ROLES.join("|")})\\.ts$`);

describe("un fichier dit son rôle par son suffixe", () => {
  it("chaque fichier porte un suffixe de rôle", () => {
    const fautifs = sources(...GARDES).filter(
      (f) =>
        !ASSEMBLEURS.includes(basename(f)) &&
        !estUnComposant(f) &&
        !ROLE.test(f) &&
        !SANS_SUFFIXE_POUR_L_INSTANT.some((exception) =>
          typeof exception === "string" ? exception === f : exception.test(f),
        ),
    );
    expect(
      fautifs,
      "Un fichier dit son rôle par son suffixe (QUAL-018) : " +
        `${ROLES.map((role) => `\`.${role}.ts\``).join(", ")}. Seuls ` +
        "un `index.ts` et un `container.ts` s'en passent. Un fichier sans rôle en mélange plusieurs : " +
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

  it("un middleware vit dans server/", () => {
    const fautifs = sources("core", "front", "shared").filter((f) =>
      f.endsWith(".middleware.ts"),
    );
    expect(
      fautifs,
      "Un middleware (`.middleware.ts`) laisse passer ou refuse une requête " +
        "HTTP (QUAL-018) : il appartient au serveur, et il vit dans `server/`.",
    ).toEqual([]);
  });

  it("un fait vit dans un dossier faits/ d'un modèle", () => {
    const fautifs = sources("core", "front", "server", "shared")
      .filter((f) => f.endsWith(".fait.ts"))
      .filter((f) => !/^core\/models\/[^/]+\/faits\//.test(f));
    expect(
      fautifs,
      "Une déclaration de fait (`.fait.ts`) est un fichier d'un modèle " +
        "(QUAL-018) : elle vit dans `core/models/<modèle>/faits/`.",
    ).toEqual([]);
  });

  it("une question vit dans un dossier questions/ d'un modèle", () => {
    const fautifs = sources("core", "front", "server", "shared")
      .filter((f) => f.endsWith(".question.ts"))
      .filter((f) => !/^core\/models\/[^/]+\/questions\//.test(f));
    expect(
      fautifs,
      "Une déclaration de question (`.question.ts`) est un fichier d'un " +
        "modèle (QUAL-018) : elle vit dans `core/models/<modèle>/questions/`.",
    ).toEqual([]);
  });

  it("une rubrique vit dans un dossier rubriques/ d'un cerfa", () => {
    const fautifs = sources("core", "front", "server", "shared")
      .filter((f) => f.endsWith(".rubrique.ts"))
      .filter((f) => !/^core\/models\/[^/]+\/r3\/rubriques\//.test(f));
    expect(
      fautifs,
      "Une déclaration de rubrique (`.rubrique.ts`) est un cadre du cerfa " +
        "papier que plusieurs cerfa partagent (QUAL-018) : elle vit dans " +
        "`core/models/<modèle>/r3/rubriques/`.",
    ).toEqual([]);
  });

  it("une rubrique ne déclare qu'elle-même et son type", () => {
    const fautifs = sources(...GARDES)
      .filter((f) => f.endsWith(".rubrique.ts"))
      .filter((f) => !neDeclareQuUneRubrique(astDe(f)));
    expect(
      fautifs,
      "Un `.rubrique.ts` exporte des types et une seule constante, du type " +
        "`Rubrique<…>` (QUAL-018) : ce que deux rubriques ou un cerfa " +
        "partagent (une fonction, une table) va dans le fichier de son rôle, " +
        "à côté.",
    ).toEqual([]);
  });

  it("une condition vit dans un dossier conditions/ d'une partie", () => {
    const fautifs = sources("core", "front", "server", "shared")
      .filter((f) => f.endsWith(".condition.ts"))
      .filter(
        (f) => !/^core\/models\/[^/]+\/questions\/p\d\/conditions\//.test(f),
      );
    expect(
      fautifs,
      "Une condition (`.condition.ts`) est une lecture booléenne que des " +
        "questions se partagent (QUAL-018) : elle vit dans " +
        "`core/models/<modèle>/questions/p<N>/conditions/`.",
    ).toEqual([]);
  });

  it("une condition n'exporte que des conditions", () => {
    const fautifs = sources(...GARDES)
      .filter((f) => f.endsWith(".condition.ts"))
      .flatMap(exportsQuiNeSontPasDesConditions);
    expect(
      fautifs,
      "Un `.condition.ts` n'exporte que des conditions (QUAL-018) : des " +
        "lectures booléennes (`Reading<boolean>`), bâties avec `given…`. Une " +
        "fonction, une classe, un type ou une lecture d'autre chose qu'un oui " +
        "ou un non va dans le fichier de son rôle : `.service.ts`, `.types.ts`, " +
        "`.constants.ts`. Elle sort de `conditions/`, vers ce qui la lit.",
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
        "`question.vo.ts`, ou `model.factory.ts` à côté de `model.types.ts`. Qui cherche comment naît une notion regarde à côté " +
        "d'elle.",
    ).toEqual([]);
  });
});

// ---- implémentation ----

// Les dossiers des modèles de `core/models/` qui suivent déjà la règle.
function dossiersGardesDesModeles(): string[] {
  return readdirSync(join(racine, "core/models"))
    .flatMap((modele) =>
      DOSSIERS_DES_MODELES.map((dossier) => `core/models/${modele}/${dossier}`),
    )
    .filter((dossier) => existsSync(join(racine, dossier)));
}

// Des types, et une seule constante annotée `Rubrique<…>`. Le privé est libre.
function neDeclareQuUneRubrique(source: ts.SourceFile): boolean {
  const exportees = source.statements.filter(exporteQuelqueChose);
  const types = exportees.filter(
    (instruction) =>
      ts.isTypeAliasDeclaration(instruction) ||
      ts.isInterfaceDeclaration(instruction) ||
      (ts.isExportDeclaration(instruction) && instruction.isTypeOnly),
  );
  const autres = exportees.filter(
    (instruction) => !types.includes(instruction),
  );
  const [rubrique, ...reste] = autres;
  return (
    rubrique !== undefined &&
    reste.length === 0 &&
    ts.isVariableStatement(rubrique) &&
    rubrique.declarationList.declarations.length === 1 &&
    (rubrique.declarationList.declarations[0]?.type
      ?.getText(source)
      .startsWith("Rubrique<") ??
      false)
  );
}

function exporteQuelqueChose(instruction: ts.Statement): boolean {
  return (
    ts.isExportDeclaration(instruction) ||
    ts.isExportAssignment(instruction) ||
    (ts.canHaveModifiers(instruction) &&
      Boolean(
        ts
          .getModifiers(instruction)
          ?.some(({ kind }) => kind === ts.SyntaxKind.ExportKeyword),
      ))
  );
}

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
  return ["vo", "entity", "types"].some((role) =>
    existsSync(join(racine, dirname(fabrique), `${produit}.${role}.ts`)),
  );
}
