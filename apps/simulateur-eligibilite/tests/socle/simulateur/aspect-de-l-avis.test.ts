// L'aspect de l'avis (#195), lu dans sa feuille de style : les couleurs de la
// présentation de `CONTRAT_SATISFACTION.json`, et un texte qui reste lisible
// au repos, au survol et à l'activation (contraste WCAG supérieur à 4,5:1).
// Le libellé qui passe à la ligne sur mobile se vérifie à l'écran : le
// navigateur de test ne calcule pas la mise en page.

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
  it("prend les couleurs du contrat", () => {
    expect(declaration(LIEN, "color")).toBe("#1e1e1e");
    expect(declaration(LIEN, "background-color")).toBe("#ff9b30");
    expect(declaration(`${LIEN}:hover`, "background-color")).toBe("#ffb56b");
    expect(declaration(`${LIEN}:active`, "background-color")).toBe("#f08416");
    expect(declaration(`${LIEN}:focus-visible`, "outline")).toBe(
      "3px solid #1e1e1e",
    );
    expect(declaration(`${LIEN}:focus-visible`, "outline-offset")).toBe("3px");
  });

  it.each([LIEN, `${LIEN}:hover`, `${LIEN}:active`])(
    "garde un texte lisible : %s",
    (etat) => {
      const texte = declaration(LIEN, "color");
      const fond = declaration(etat, "background-color");

      expect(contraste(texte, fond)).toBeGreaterThan(4.5);
    },
  );

  it("passe à la ligne plutôt que de couper son libellé", () => {
    expect(declaration(LIEN, "white-space")).toBe("normal");
    expect(declaration(LIEN, "max-width")).toBe("100%");
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
