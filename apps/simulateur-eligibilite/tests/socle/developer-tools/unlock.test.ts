import { describe, expect, it } from "vitest";
import {
  debugTraceUnlocked,
  developerToolsUnlocked,
} from "../../../front/socle/developer-tools/unlock";

// Les developer tools s'ouvrent en local, jamais sur un build de production
// (D-279). Le service choisi n'y est pour rien.

describe("developerToolsUnlocked", () => {
  it("les ouvre sous le serveur de dev", () => {
    expect(developerToolsUnlocked({ DEV: true })).toBe(true);
  });

  it("les ouvre sous les tests, qui tournent en local", () => {
    expect(developerToolsUnlocked()).toBe(true);
  });

  it("ne les ouvre jamais sur un build de production", () => {
    expect(developerToolsUnlocked({ DEV: false })).toBe(false);
  });
});

// La trace de debug s'ouvre avec les developer tools, et partout pour la
// structure « Assurance Maladie » (D-280).

describe("debugTraceUnlocked", () => {
  it("l'ouvre avec les developer tools, quelle que soit la structure", () => {
    expect(debugTraceUnlocked(true, null)).toBe(true);
  });

  it("l'ouvre sur un build de production pour « Assurance Maladie »", () => {
    expect(debugTraceUnlocked(false, "Assurance Maladie")).toBe(true);
  });

  it("la garde fermée sur un build de production pour un établissement ou une autre structure", () => {
    expect(debugTraceUnlocked(false, null)).toBe(false);
    expect(debugTraceUnlocked(false, "Libéral")).toBe(false);
  });
});
