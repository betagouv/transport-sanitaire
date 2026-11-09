import { describe, expect, it } from "vitest";
import { developerToolsUnlocked } from "../../../front/socle/developer-tools/unlock";

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
