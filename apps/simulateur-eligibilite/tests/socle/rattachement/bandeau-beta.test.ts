import { describe, expect, it } from "vitest";
import { bandeauBetaDemande } from "../../../front/socle/rattachement/BandeauBeta";

// L'environnement demande le bandeau bêta par `VITE_BANDEAU_BETA=true` (#376).

describe("bandeauBetaDemande", () => {
  it("vaut vrai avec VITE_BANDEAU_BETA=true", () => {
    expect(bandeauBetaDemande({ VITE_BANDEAU_BETA: "true" })).toBe(true);
  });

  it("vaut faux sans la variable, ou avec une autre valeur", () => {
    expect(bandeauBetaDemande({})).toBe(false);
    expect(bandeauBetaDemande({ VITE_BANDEAU_BETA: "false" })).toBe(false);
    expect(bandeauBetaDemande({ VITE_BANDEAU_BETA: "1" })).toBe(false);
  });
});
