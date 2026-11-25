// Ce que les exports d'un `.condition.ts` sont, sur le typage du compilateur
// (`roles-par-suffixe.test.ts`).

import { join } from "node:path";
import ts from "typescript";
import { racine } from "./inspection-des-sources";

// « fichier : nom », pour chaque export qui n'est pas une constante de type
// `Reading<boolean>`. Sur le typage du compilateur : une lecture bâtie par
// `given…` n'annonce son type nulle part.
export function exportsQuiNeSontPasDesConditions(fichier: string): string[] {
  const programme = ts.createProgram({
    rootNames: [join(racine, fichier)],
    options: optionsDeLApp(),
  });
  const types = programme.getTypeChecker();
  const source = programme.getSourceFile(join(racine, fichier));
  const module = source && types.getSymbolAtLocation(source);
  if (!module) return [];
  return types
    .getExportsOfModule(module)
    .filter((symbole) => !estUneCondition(symbole, types))
    .map((symbole) => `${fichier} : ${symbole.name}`);
}

function estUneCondition(symbole: ts.Symbol, types: ts.TypeChecker): boolean {
  const declaration = symbole.valueDeclaration;
  if (!declaration || !ts.isVariableDeclaration(declaration)) return false;
  const type = types.getTypeAtLocation(declaration);
  const [lu] = types.getTypeArguments(type as ts.TypeReference);
  return (
    type.symbol?.name === "Reading" &&
    lu !== undefined &&
    (lu.flags & ts.TypeFlags.Boolean) !== 0
  );
}

function optionsDeLApp(): ts.CompilerOptions {
  const fichier = join(racine, "tooling/tsconfig.app.json");
  const { config } = ts.readConfigFile(fichier, ts.sys.readFile);
  return ts.parseJsonConfigFileContent(config, ts.sys, join(racine, "tooling"))
    .options;
}
