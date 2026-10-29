// L'aspect de l'avis (D-234), lu dans sa feuille de style : les couleurs de V01
// et du § 5.1 de `REFERENTIEL/03` (v10.1.4), et un texte lisible au repos
// (contraste WCAG supérieur à 4,5:1). Le survol et l'activation ne l'ont pas ;
// l'éditeur le sait et garde ces couleurs. La place dans la barre se vérifie à
// l'écran : le navigateur de test ne calcule pas la mise en page.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { racine } from "../../inspection-des-sources";

const CSS = readFileSync(
  join(racine, "front/socle/simulateur/feedback-link.css"),
  "utf-8",
);

const LIEN = "a.socle-feedback__link";

describe("l'aspect de l'avis", () => {
  it("prend les couleurs de V01", () => {
    expect(declaration(LIEN, "color")).toBe("#ffffff");
    expect(declaration(LIEN, "background-color")).toBe("#a558a0");
    expect(declaration(`${LIEN}:hover`, "background-color")).toBe("#d282cd");
    expect(declaration(`${LIEN}:active`, "background-color")).toBe("#db9cd6");
  });

  it("garde un texte lisible au repos", () => {
    const texte = declaration(LIEN, "color");
    const fond = declaration(LIEN, "background-color");

    expect(contraste(texte, fond)).toBeGreaterThan(4.5);
  });

  it("tient son libellé sur une ligne, à la hauteur d'un bouton", () => {
    expect(declaration(LIEN, "white-space")).toBe("nowrap");
    expect(declaration(LIEN, "min-height")).toBe("3rem");
  });
});

// ---- implémentation ----

// La valeur de `propriete` dans la règle dont le sélecteur est `selecteur`.
function declaration(selecteur: string, propriete: string): string {
  const echappe = selecteur.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regle = new RegExp(`(?:^|\\n)${echappe}\\s*\\{([^}]*)\\}`).exec(CSS);
  const valeur = regle?.[1]
    ?.split(";")
    .map((ligne) => ligne.trim().split(/:\s*/))
    .find(([nom]) => nom === propriete)?.[1];
  if (!valeur) throw new Error(`${selecteur} n'a pas de ${propriete}.`);
  return valeur;
}

// Le rapport de contraste WCAG 2 de deux couleurs `#rrggbb`.
function contraste(une: string, autre: string): number {
  const [clair, sombre] = [luminance(une), luminance(autre)].sort(
    (a, b) => b - a,
  ) as [number, number];
  return (clair + 0.05) / (sombre + 0.05);
}

function luminance(couleur: string): number {
  const [r, g, b] = [1, 3, 5].map((debut) => {
    const canal = Number.parseInt(couleur.slice(debut, debut + 2), 16) / 255;
    return canal <= 0.039_28 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
