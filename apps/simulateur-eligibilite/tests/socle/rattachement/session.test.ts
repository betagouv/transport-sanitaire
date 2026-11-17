import { describe, expect, it } from "vitest";
import {
  rangerRattachement,
  rattachementEnSession,
} from "../../../front/socle/rattachement/rattachement-en-session";
import { RattachementDuReferentiel } from "../../../shared/rattachement-du-referentiel.vo";

const rattachement = RattachementDuReferentiel.choisi({
  etabId: "7",
  serviceId: "42",
});

describe("session de rattachement", () => {
  it("conserve le rattachement renseigné", () => {
    rangerRattachement(rattachement);
    expect(rattachementEnSession()).toEqual(rattachement);
  });

  it("n'a rien tant que personne ne s'est rattaché", () => {
    rangerRattachement(null);
    expect(rattachementEnSession()).toBeNull();
  });
});
