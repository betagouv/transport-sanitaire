// @vitest-environment node
//
// La configuration est lue depuis un environnement passé en paramètre. Ces tests
// décrivent donc des déploiements possibles, sans rien simuler. En production,
// une variable manquante ou mal formée arrête le démarrage. Sinon le serveur
// servirait un référentiel factice.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ErreurDeConfiguration,
  lireConfiguration,
} from "../../../server/configuration.ts";

const PROD = { NODE_ENV: "production" };
const CLE = "cle-grist";
const DOC = "https://grist.example/api/docs/referentiel";
const COMPLET = { ...PROD, GRIST_API_KEY: CLE, GRIST_DOC_URL: DOC };

describe("configuration du serveur en production", () => {
  it("refuse de démarrer et nomme les variables manquantes", () => {
    expect(() => lireConfiguration(PROD)).toThrow(ErreurDeConfiguration);
    try {
      lireConfiguration(PROD);
    } catch (erreur) {
      expect((erreur as ErreurDeConfiguration).variables).toEqual([
        "GRIST_DOC_URL",
        "GRIST_API_KEY",
      ]);
    }
  });

  it("refuse une URL de doc Grist qui n'en est pas une", () => {
    const mauvaise = { ...COMPLET, GRIST_DOC_URL: "grist.example" };
    expect(() => lireConfiguration(mauvaise)).toThrow(
      "GRIST_DOC_URL : doit être une URL",
    );
  });

  it("tient une variable posée mais vide pour absente", () => {
    const vide = { ...COMPLET, GRIST_API_KEY: "  " };
    expect(() => lireConfiguration(vide)).toThrow(/GRIST_API_KEY/);
  });

  it("démarre dès que la clé et le doc Grist sont fournis", () => {
    const config = lireConfiguration(COMPLET);
    expect(config.grist).toEqual({ cleApi: CLE, docUrl: DOC });
  });

  it("laisse son défaut au port", () => {
    const config = lireConfiguration(COMPLET);
    expect(config.port).toBe(3000);
  });

  it("garde le journal en mémoire tant que son doc n'est pas donné", () => {
    const config = lireConfiguration(COMPLET);
    expect(config.journal).toBeUndefined();
  });

  it("écrit le journal dans le doc donné, avec la clé Grist", () => {
    const config = lireConfiguration({
      ...COMPLET,
      JOURNAL_GRIST_DOC_URL: "https://grist.example/api/docs/journal",
    });
    expect(config.journal).toEqual({
      cleApi: CLE,
      docUrl: "https://grist.example/api/docs/journal",
    });
  });

  it("écrit le nom de l'app Scalingo comme environnement du journal", () => {
    const config = lireConfiguration({ ...COMPLET, APP: "simulateur-staging" });
    expect(config.environment).toBe("simulateur-staging");
  });
});

describe("l'app servie, sur le signe de vie du journal", () => {
  it("prend la version de package.json", () => {
    const { version } = JSON.parse(
      readFileSync(new URL("../../../package.json", import.meta.url), "utf8"),
    ) as { version: string };

    expect(lireConfiguration(COMPLET).build.app_version).toBe(version);
  });

  it("prend le commit que Scalingo pose sur le conteneur, sur 7 caractères", () => {
    const config = lireConfiguration({
      ...COMPLET,
      CONTAINER_VERSION: "f30aafe9c0de4b1e2a3b4c5d6e7f8091a2b3c4d5",
    });
    expect(config.build.commit_sha).toBe("f30aafe");
  });

  it.each([
    ["absent", undefined],
    ["qui n'est pas un commit", "v0.8.0"],
  ])("avoue un commit inconnu quand il est %s", (_, CONTAINER_VERSION) => {
    const config = lireConfiguration({ ...COMPLET, CONTAINER_VERSION });
    expect(config.build.commit_sha).toBe("inconnu");
  });
});

describe("variables mal formées", () => {
  it("refuse un port qui n'est pas un entier positif", () => {
    expect(() => lireConfiguration({ PORT: "quatre-mille" })).toThrow(/PORT/);
    expect(() => lireConfiguration({ PORT: "-1" })).toThrow(/PORT/);
  });

  it("refuse une URL de doc Grist qui n'en est pas une", () => {
    expect(() => lireConfiguration({ GRIST_DOC_URL: "grist.example" })).toThrow(
      /GRIST_DOC_URL/,
    );
  });

  it("nomme la variable et dit ce qui cloche", () => {
    try {
      lireConfiguration({ PORT: "quatre-mille" });
      expect.unreachable("la configuration aurait dû être refusée");
    } catch (erreur) {
      expect((erreur as Error).message).toContain("PORT : doit être");
    }
  });
});

describe("configuration du serveur hors production", () => {
  it("se replie sur le snapshot", () => {
    const config = lireConfiguration({});
    expect(config.grist).toBeUndefined();
  });

  it("se replie sur le snapshot quand le doc Grist manque", () => {
    const config = lireConfiguration({ GRIST_API_KEY: CLE });
    expect(config.grist).toBeUndefined();
  });

  it("prend l'accès Grist quand la clé est là", () => {
    const config = lireConfiguration({
      GRIST_API_KEY: CLE,
      GRIST_DOC_URL: "https://grist.example/api/docs/abc",
      PORT: "4000",
    });
    expect(config.grist).toEqual({
      cleApi: CLE,
      docUrl: "https://grist.example/api/docs/abc",
    });
    expect(config.port).toBe(4000);
  });
});
