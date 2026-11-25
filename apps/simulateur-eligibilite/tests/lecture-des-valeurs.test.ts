// Ce que le modèle et l'écran lisent, rendu exécutable (ARCH-005, ARCH-008) : un
// fait et une cible se lisent par leurs méthodes, et R2 comme R3 lisent des
// valeurs, pas les réponses brutes.
//
// Comme dans `architecture.test.ts`, chaque règle donne son pourquoi dans son
// message d'échec.

import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { racine, sources, texteDe } from "./inspection-des-sources";

const RACINES = ["core", "front", "server", "shared"];

// Ce qui définit un fait et une cible, et en fait des conditions : lire leur
// valeur nue est leur métier. Tout le reste passe par leurs méthodes.
const DEFINISSENT = [
  "core/socle/decision-engine/",
  "core/socle/questionnaire-engine/conditions/given-readings.vo.ts",
];

const COMPARAISONS = new Set([
  ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.EqualsEqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken,
  ts.SyntaxKind.ExclamationEqualsEqualsToken,
]);

// Les réponses brutes, que le socle donne au calcul des faits et aux gardes de
// déclaration seulement.
const REPONSES_BRUTES = /\b(GivenAnswers|ValidatedAnswers)\b/;
// R2 et R3 d'un modèle : leur calcul est dans `core/models/<nom>/r2|r3/`, leur
// rendu dans `front/models/<nom>/r2|r3/`.
const UN_RESULTAT = /^(core|front)\/models\/[^/]+\/r[23](\/|\.tsx?$)/;

describe("un fait et une cible se lisent par leurs méthodes", () => {
  it("aucun `.value` d'un fait ou d'une cible n'est comparé", () => {
    expect(
      comparaisonsDeValeur(),
      "Un fait ou une cible inconnu n'est pas un « non » : `.value === true` " +
        "et `.value == null` mêlent l'inconnu, le sans objet et le faux. " +
        "Lis `isOui()`, `isNon()`, `isInconnu()` (un fait), `isInconnue()`, " +
        "`isSansObjet()` ou `is(constante)` (une cible). La valeur nue reste " +
        "lisible pour l'afficher ou l'exporter, jamais pour la comparer.",
    ).toEqual([]);
  });
});

describe("R2 et R3 lisent des valeurs", () => {
  it("aucun fichier de R2 ni de R3 ne reçoit les réponses brutes", () => {
    const fautifs = sources("core/models", "front/models")
      .filter((fichier) => UN_RESULTAT.test(fichier))
      .filter((fichier) => REPONSES_BRUTES.test(texteDe(fichier)));
    expect(
      fautifs,
      "R2 et R3 lisent des valeurs (`given…`) que le socle calcule sur les " +
        "questions validées, les faits et les cibles (ARCH-008). Une fonction " +
        "qui recevrait les réponses lirait ce qu'elle veut, et ce qu'elle lit " +
        "ne se saurait qu'en l'exécutant.",
    ).toEqual([]);
  });
});

// ---- implémentation ----

// « fichier:ligne — texte de la comparaison », sur le typage du compilateur : un
// nom de variable ne dit pas si elle tient un fait.
function comparaisonsDeValeur(): string[] {
  const programme = ts.createProgram({
    rootNames: sources(...RACINES).map((fichier) => join(racine, fichier)),
    options: optionsDeLApp(),
  });
  const types = programme.getTypeChecker();
  return sources(...RACINES)
    .filter(
      (fichier) => !DEFINISSENT.some((debut) => fichier.startsWith(debut)),
    )
    .flatMap((fichier) => {
      const source = programme.getSourceFile(join(racine, fichier));
      return source ? valeursComparees(source, types, fichier) : [];
    });
}

function valeursComparees(
  source: ts.SourceFile,
  types: ts.TypeChecker,
  fichier: string,
): string[] {
  const trouvees: string[] = [];
  const visiter = (noeud: ts.Node): void => {
    if (estUneValeurComparee(noeud) && estUnFaitOuUneCible(noeud, types)) {
      const { line } = source.getLineAndCharacterOfPosition(noeud.getStart());
      trouvees.push(`${fichier}:${line + 1} — ${noeud.parent.getText(source)}`);
    }
    ts.forEachChild(noeud, visiter);
  };
  visiter(source);
  return trouvees;
}

function estUneValeurComparee(
  noeud: ts.Node,
): noeud is ts.PropertyAccessExpression {
  return (
    ts.isPropertyAccessExpression(noeud) &&
    noeud.name.text === "value" &&
    ts.isBinaryExpression(noeud.parent) &&
    COMPARAISONS.has(noeud.parent.operatorToken.kind)
  );
}

function estUnFaitOuUneCible(
  acces: ts.PropertyAccessExpression,
  types: ts.TypeChecker,
): boolean {
  const nom = types.getTypeAtLocation(acces.expression).getNonNullableType()
    .symbol?.name;
  return nom === "Fait" || nom === "Cible";
}

function optionsDeLApp(): ts.CompilerOptions {
  const fichier = join(racine, "tooling/tsconfig.app.json");
  const { config } = ts.readConfigFile(fichier, ts.sys.readFile);
  return ts.parseJsonConfigFileContent(config, ts.sys, join(racine, "tooling"))
    .options;
}
