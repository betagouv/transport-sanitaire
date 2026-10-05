// Tests de la cible (sans mock, sans I/O) : lecture de la ligne de commande, nom de la
// variable d'environnement, et restriction des trajets aux plateformes de la cible.

import { describe, expect, it } from "vitest";
import { restreindre } from "../src/04-marts/perimetre.ts";
import { lienDocument, lireArguments, variableDocUrl } from "../src/cible.ts";
import type { TrajetReconcilieRow } from "../src/contrats.ts";

describe("lireArguments", () => {
  it("laisse le périmètre complet quand aucune cible n'est nommée", () => {
    expect(lireArguments(["ght_2024"])).toEqual({
      cible: "",
      reste: ["ght_2024"],
    });
  });

  it("sépare la cible des arguments positionnels, où qu'elle soit placée", () => {
    const attendu = { cible: "partenaire-a", reste: ["ght_2024"] };
    expect(lireArguments(["--cible", "partenaire-a", "ght_2024"])).toEqual(
      attendu,
    );
    expect(lireArguments(["ght_2024", "--cible", "partenaire-a"])).toEqual(
      attendu,
    );
  });

  it("refuse une cible sans nom", () => {
    expect(() => lireArguments(["--cible"])).toThrow("--cible attend un nom");
    expect(() => lireArguments(["--cible", "--autre"])).toThrow();
  });
});

describe("variableDocUrl", () => {
  it("nomme la variable du document interne, puis celle d'une cible", () => {
    expect(variableDocUrl("")).toBe("GRIST_DOC_URL");
    expect(variableDocUrl("partenaire-a")).toBe("GRIST_DOC_URL_PARTENAIRE_A");
  });
});

describe("lienDocument", () => {
  it("donne l'adresse du document à ouvrir, d'après sa base API", () => {
    const org = "https://grist.example/o/org";
    expect(lienDocument(`${org}/api/docs/abcdefghijkl`)).toBe(
      `${org}/abcdefghijkl`,
    );
    expect(lienDocument(`${org}/api/docs/abcdefghijklMNOPQRSTUV/`)).toBe(
      `${org}/abcdefghijkl`,
    );
  });

  it("rend l'adresse telle quelle si elle n'est pas une base API", () => {
    expect(lienDocument("https://grist.example/ailleurs")).toBe(
      "https://grist.example/ailleurs",
    );
  });
});

describe("restreindre", () => {
  const trajet = (role: string, source: string) =>
    ({ role, source }) as TrajetReconcilieRow;

  it("retire les trajets des plateformes hors cible et garde tout le référentiel", () => {
    const rows = restreindre(
      [
        trajet("plateforme", "plateforme-a"),
        trajet("plateforme", "plateforme-b"),
        trajet("referentiel-national", "reference-1"),
      ],
      new Set(["plateforme-a"]),
    );
    expect(rows.map((t) => t.source)).toEqual(["plateforme-a", "reference-1"]);
  });
});
