import { describe, expect, it } from "vitest";
import { UnlockService } from "../../../front/socle/developer-tools/unlock.service";

// Les developer tools s'ouvrent en local, jamais sur un build de production. Le
// service choisi n'y est pour rien.

describe("developerToolsUnlocked", () => {
  it("les ouvre sous le serveur de dev", () => {
    expect(UnlockService.developerToolsUnlocked({ DEV: true })).toBe(true);
  });

  it("les ouvre sous les tests, qui tournent en local", () => {
    expect(UnlockService.developerToolsUnlocked()).toBe(true);
  });

  it("ne les ouvre jamais sur un build de production", () => {
    expect(UnlockService.developerToolsUnlocked({ DEV: false })).toBe(false);
  });
});

// La trace de debug s'ouvre avec les developer tools, et partout pour la
// structure « Assurance Maladie ».

describe("debugTraceUnlocked", () => {
  it("l'ouvre avec les developer tools, quelle que soit la structure", () => {
    expect(UnlockService.debugTraceUnlocked(true, null)).toBe(true);
  });

  it("l'ouvre sur un build de production pour « Assurance Maladie »", () => {
    expect(UnlockService.debugTraceUnlocked(false, "Assurance Maladie")).toBe(
      true,
    );
  });

  it("la garde fermée sur un build de production pour un établissement ou une autre structure", () => {
    expect(UnlockService.debugTraceUnlocked(false, null)).toBe(false);
    expect(UnlockService.debugTraceUnlocked(false, "Libéral")).toBe(false);
  });
});
