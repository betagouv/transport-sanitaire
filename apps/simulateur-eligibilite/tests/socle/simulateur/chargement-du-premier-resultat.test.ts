// Le chargement du premier résultat se garde par modèle et par réponses : un
// rendu de plus ne relance pas le chargement.

import { describe, expect, it } from "vitest";
import { Simulation } from "../../../core/socle/simulation";
import type { FirstResult } from "../../../front/socle/model";
import { FirstResultService } from "../../../front/socle/simulateur/screens/first-result.service";
import { modeleDeTest } from "../modele-de-test";
import { qui } from "./questionnaire";

const RESULTAT: FirstResult = { title: "Titre", intro: "Intro", body: "Corps" };

describe("le chargement du premier résultat", () => {
  it("rend la même promesse pour le même modèle et les mêmes réponses", () => {
    let appels = 0;
    const modele = qui(() => {
      appels += 1;
      return Promise.resolve(RESULTAT);
    });
    const simulation = Simulation.resume(modele.core, {});

    const premiere = new FirstResultService(modele).of(simulation);

    expect(new FirstResultService(modele).of(simulation)).toBe(premiere);
    expect(appels).toBe(1);
  });

  it("recharge pour une autre saisie des réponses", () => {
    let appels = 0;
    const modele = qui(() => {
      appels += 1;
      return Promise.resolve(RESULTAT);
    });
    const service = new FirstResultService(modele);

    service.of(Simulation.resume(modele.core, {}));
    service.of(Simulation.resume(modele.core, {}));

    expect(appels).toBe(2);
  });

  it("rend tout de suite un contenu qui n'est pas promis", () => {
    const simulation = Simulation.resume(modeleDeTest.core, {});

    expect(new FirstResultService(modeleDeTest).of(simulation)).toEqual(
      expect.objectContaining({ title: expect.any(String) }),
    );
  });
});
