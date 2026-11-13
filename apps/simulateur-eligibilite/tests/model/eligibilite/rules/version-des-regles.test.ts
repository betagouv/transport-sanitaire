// La version des règles que le journal des parcours reçoit (ADR-14
// d'analytics) : celle que l'intégration d'une livraison écrit dans
// `rules/VERSION`. Une montée du modèle la change sans toucher à la collecte.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { model } from "../../../../front/models/eligibilite";

const VERSION = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../core/models/eligibilite/rules/VERSION",
);

describe("la version des règles du modèle de l'éditeur", () => {
  it("est celle de rules/VERSION, sans son retour à la ligne", () => {
    expect(model.version).toBe(readFileSync(VERSION, "utf-8").trim());
    expect(model.version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
